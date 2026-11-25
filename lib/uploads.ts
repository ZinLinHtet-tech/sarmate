/** Shared upload policy; browser and server both enforce it. */
export const FILE_TYPES = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  pdf: 'application/pdf', ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
} as const;
export type FileExtension = keyof typeof FILE_TYPES;
export const FILE_ACCEPT = Object.keys(FILE_TYPES).map(ext => `.${ext}`).join(',');
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BATCH_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const isImage = (ext: FileExtension) => FILE_TYPES[ext].startsWith('image/');
export function extensionOf(name: string): FileExtension | undefined {
  const ext = name.split('.').length > 1 ? name.split('.').pop()!.toLowerCase() : '';
  return Object.prototype.hasOwnProperty.call(FILE_TYPES, ext) ? ext as FileExtension : undefined;
}
export function validateFile(file: {name: string; size: number; type: string}): string | undefined {
  const ext = extensionOf(file.name);
  const type = file.type.toLowerCase().split(';')[0].trim();
  if (type.startsWith('video/') || !ext) return 'Unsupported file format. Use JPG, JPEG, PNG, WEBP, PDF, PPT, PPTX, DOC, DOCX or TXT. Videos are not supported.';
  if (file.name.length > 255 || /[\x00-\x1f\x7f/\\]/u.test(file.name)) return 'Invalid file name.';
  if (!Number.isSafeInteger(file.size) || file.size <= 0) return 'The file is empty or invalid.';
  if (file.size > MAX_FILE_BYTES) return 'The file exceeds the 5 MB limit.';
  const generic = !type || type === 'application/octet-stream';
  if (!generic && type !== FILE_TYPES[ext] && !(['docx','pptx'].includes(ext) && type === 'application/zip') && !(ext==='jpg' || ext==='jpeg' ? type==='image/jpg' : false)) return 'The file type does not match its extension.';
}
const starts = (bytes: Uint8Array, prefix: number[], offset=0) => prefix.every((n,i)=>bytes[offset+i]===n);
const ascii = (bytes: Uint8Array, offset: number, size: number) => String.fromCharCode(...bytes.subarray(offset,offset+size));
/** Check OOXML central-directory names rather than accepting arbitrary ZIPs. */
function officeZip(bytes: Uint8Array, ext: 'docx'|'pptx'): boolean {
  if (!starts(bytes,[80,75,3,4]) || bytes.length < 22) return false;
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let end = bytes.length-22;
  for (;end>=Math.max(0,bytes.length-65557);end--) if (view.getUint32(end,true)===0x06054b50 && end+22+view.getUint16(end+20,true)===bytes.length) break;
  if (end<Math.max(0,bytes.length-65557)) return false;
  const count=view.getUint16(end+10,true), size=view.getUint32(end+12,true);
  let pos=view.getUint32(end+16,true);
  if (view.getUint16(end+4,true)!==0 || view.getUint16(end+6,true)!==0 || view.getUint16(end+8,true)!==count || count>10000 || pos+size!==end) return false;
  let contentTypes=false, main=false, totalExpanded=0;
  for(let i=0;i<count;i++) {
    if(pos+46>end || view.getUint32(pos,true)!==0x02014b50) return false;
    const nameSize=view.getUint16(pos+28,true), extra=view.getUint16(pos+30,true), comment=view.getUint16(pos+32,true);
    if(pos+46+nameSize+extra+comment>end || (view.getUint16(pos+8,true)&1)!==0) return false;
    totalExpanded+=view.getUint32(pos+24,true);
    if(totalExpanded>50*1024*1024) return false;
    const name=ascii(bytes,pos+46,nameSize);
    contentTypes ||= name==='[Content_Types].xml';
    main ||= name===(ext==='docx'?'word/document.xml':'ppt/presentation.xml');
    pos+=46+nameSize+extra+comment;
  }
  return pos===end && contentTypes && main;
}
export function decodeText(bytes: Uint8Array): string {
  const encoding=starts(bytes,[255,254])?'utf-16le':starts(bytes,[254,255])?'utf-16be':'utf-8';
  const text=new TextDecoder(encoding,{fatal:true}).decode(bytes);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(text)) throw new Error('Not a readable text file.');
  return text;
}
export function matchesContent(bytes: Uint8Array, ext: FileExtension): boolean {
  switch(ext) {
    case 'jpg': case 'jpeg': return starts(bytes,[255,216,255]);
    case 'png': return starts(bytes,[137,80,78,71,13,10,26,10]);
    case 'webp': return ascii(bytes,0,4)==='RIFF' && ascii(bytes,8,4)==='WEBP';
    case 'pdf': return ascii(bytes,0,5)==='%PDF-';
    case 'docx': case 'pptx': return officeZip(bytes,ext);
    case 'doc': case 'ppt': {
      if (!starts(bytes,[208,207,17,224,161,177,26,225]) || bytes.length<512) return false;
      // Legacy Office compound files contain UTF-16LE stream names in directory entries.
      const name=ext==='doc'?'WordDocument':'PowerPoint Document';
      const prefix=[...name].flatMap(c=>[c.charCodeAt(0),0]).concat([0,0]);
      for(let i=512;i+prefix.length<=bytes.length;i+=128) if(starts(bytes,prefix,i)) return true;
      return false;
    }
    case 'txt': try { decodeText(bytes); return true; } catch { return false; }
  }
}
