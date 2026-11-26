'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { FILE_ACCEPT, FILE_TYPES, MAX_BATCH_BYTES, MAX_FILES, extensionOf, isImage, validateFile } from '../lib/uploads';
import { MAX_LENGTH } from '../lib/study';

function Preview({file,disabled,onRemove}:{file:File;disabled:boolean;onRemove:()=>void}) {
  const [url,setUrl]=useState('');
  const ext=extensionOf(file.name)!;
  useEffect(()=>{
    const object=URL.createObjectURL(new Blob([file],{type:FILE_TYPES[ext]}));
    setUrl(object);
    return ()=>URL.revokeObjectURL(object);
  },[file,ext]);
  const inline=isImage(ext)||ext==='pdf'||ext==='txt';
  return <li className="upload-file">
    {isImage(ext)&&url?<img className="upload-thumb" src={url} alt=""/>:<span className="upload-thumb upload-doc"><FileText size={21}/></span>}
    <div className="upload-file-info"><strong title={file.name}>{file.name}</strong><span>{ext.toUpperCase()} · {file.size<1024*1024?`${Math.max(1,Math.round(file.size/1024))} KB`:`${(file.size/(1024*1024)).toFixed(1)} MB`}</span>
    {url&&<a className="upload-preview-link" href={url} {...(inline?{target:'_blank',rel:'noopener noreferrer'}:{download:file.name})}>{inline?'Preview':'Open locally (download)'}</a>}</div>
    <button className="upload-remove" type="button" disabled={disabled} onClick={onRemove} aria-label={`Remove ${file.name}`}><X size={18}/></button>
  </li>;
}

export function LessonUpload({files,setFiles,text,onImported,busy,importing,setImporting}:{files:File[];setFiles:(files:File[])=>void;text:string;onImported:(text:string,ai:boolean)=>void;busy:boolean;importing:boolean;setImporting:(value:boolean)=>void}) {
  const input=useRef<HTMLInputElement>(null);
  const [error,setError]=useState(''),[status,setStatus]=useState(''),[dragging,setDragging]=useState(false);
  const locked=busy||importing;
  function select(list:FileList|File[]) {
    if(locked)return;
    const next=[...files],errors:string[]=[];
    for(const file of Array.from(list)){
      const issue=validateFile(file);
      if(issue){errors.push(`${file.name}: ${issue}`);continue;}
      if(next.some(f=>f.name===file.name&&f.size===file.size&&f.lastModified===file.lastModified)){errors.push(`${file.name}: already selected.`);continue;}
      if(next.length>=MAX_FILES){errors.push(`${file.name}: select up to 5 files.`);continue;}
      if(next.reduce((sum,f)=>sum+f.size,0)+file.size>MAX_BATCH_BYTES){errors.push(`${file.name}: combined files must be at most 10 MB.`);continue;}
      next.push(file);
    }
    setFiles(next);setError(errors.join('\n'));setStatus('');
  }
  async function upload(){
    if(!files.length||locked)return;
    setError('');setImporting(true);
    try{
      const imported:string[]=[];let ai=false;
      for(let i=0;i<files.length;i++){
        const file=files[i];setStatus(`Importing ${i+1} of ${files.length}: ${file.name}`);
        const response=await fetch(`/api/upload?${new URLSearchParams({filename:file.name})}`,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});
        const data=await response.json() as {text?:string;method?:string;error?:string};
        if(!response.ok||typeof data.text!=='string'||!['text','free-extracted'].includes(data.method||''))throw new Error(`${file.name}: ${data.error||'Unable to import this file.'}`);
        imported.push(data.text);ai ||= data.method==='free-extracted';
        if([text.trim(),...imported].filter(Boolean).join('\n\n').length>MAX_LENGTH)throw new Error('The combined lesson exceeds 12,000 characters. Remove a file or shorten the current lesson before importing.');
      }
      onImported([text.trim(),...imported].filter(Boolean).join('\n\n'),ai);
      setFiles([]);setStatus('Files imported. Review the lesson text below before creating your guide.');
    }catch(e){setError(e instanceof Error?e.message:'Import failed. Please try again.');setStatus('');}
    finally{setImporting(false);}
  }
  return <section className="upload-area" aria-label="Upload learning materials">
    <div className={`upload-drop ${dragging?'upload-dragging':''}`} onDragOver={e=>{e.preventDefault();if(!locked)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);select(e.dataTransfer.files);}}>
      <Upload size={21} aria-hidden="true"/><div><strong>Upload learning materials</strong><p>Images, PDF, PowerPoint, Word or TXT. No videos.</p><span>5 MB per file · 5 files · 10 MB total</span></div>
      <input ref={input} type="file" multiple accept={FILE_ACCEPT} className="sr-only" aria-label="Choose learning materials" tabIndex={-1} disabled={locked} onChange={e=>{if(e.target.files)select(e.target.files);e.target.value='';}}/>
      <button className="upload-choose" type="button" disabled={locked} onClick={()=>input.current?.click()}>Choose files</button>
    </div>
    {!!files.length&&<><ul className="upload-list">{files.map((file,i)=><Preview key={`${file.name}-${file.size}-${file.lastModified}-${i}`} file={file} disabled={locked} onRemove={()=>{setFiles(files.filter((_,j)=>i!==j));setError('');setStatus('');}}/>)}</ul><p className="upload-note">Import sends selected files to the app server. Images and non-TXT documents use the configured free extraction service. Office files can be opened locally before import. Avoid private or sensitive material.</p><button type="button" className="upload-choose upload-import" disabled={locked} onClick={upload}>{importing?'Importing…':`Import ${files.length} ${files.length===1?'file':'files'}`}</button></>}
    {status&&<p className="upload-note" role="status">{status}</p>}{error&&<div className="error upload-error" role="alert">{error}</div>}
  </section>;
}
