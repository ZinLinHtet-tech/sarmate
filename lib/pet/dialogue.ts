import type { PetLocale, PetMessage, PetStateName } from './types.ts';

export const PET_DIALOGUE: Record<PetStateName, PetMessage> = {
  hidden: { en: '', my: '' },
  greeting: { en: 'Hi! I’m Mate. Let’s study together.', my: 'မင်္ဂလာပါ! ကျွန်တော် Mate ပါ။ အတူတူ လေ့လာကြမယ်။' },
  idle: { en: 'I’m here when you’re ready.', my: 'ပြင်ဆင်ဖြစ်တဲ့အခါ ဒီမှာ ရှိနေပါတယ်။' },
  reading: { en: 'Reading along with you.', my: 'သင်နဲ့အတူ ဖတ်နေပါတယ်။' },
  focused: { en: 'One question at a time. You’ve got this.', my: 'တစ်ခေါက်တစ်ခုချင်း။ သင်လုပ်နိုင်ပါတယ်။' },
  thinking: { en: 'Putting your guide together…', my: 'လမ်းညွှန်လေး ပြင်ဆင်နေပါတယ်…' },
  uploading: { en: 'Lesson received. I’ll take a look.', my: 'သင်ခန်းစာ ရပြီ။ စစ်ဆေးကြည့်ပါမယ်။' },
  celebrating: { en: 'Nice recall! That looks right.', my: 'မှတ်မိတာ ကောင်းပါတယ်! မှန်တယ်လို့ ထင်ပါတယ်။' },
  encouraging: { en: 'Good try. Take another look.', my: 'ကြိုးစားတာ ကောင်းပါတယ်။ နောက်တစ်ခေါက် ကြည့်ပါ။' },
  hinting: { en: 'Hint: find a key word in the source.', my: 'အကြမ်းဖျင်း: မူရင်းစာထဲက အဓိက စကားလုံးကို ရှာပါ။' },
  explaining: { en: 'Let’s read the answer and source together.', my: 'အဖြေနဲ့ မူရင်းစာသားကို အတူတူ ဖတ်ကြမယ်။' },
  searching: { en: 'Looking for clues in your lesson…', my: 'သင်ခန်းစာထဲက အထောက်အထားတွေ ရှာနေပါတယ်…' },
  error: { en: 'Hmm, something went wrong. Source mode still works.', my: 'ဟမ်း… တစ်ခုခု မှားသွားတယ်။ Source mode ကတော့ အဆင်ပြေပါတယ်။' },
  sleeping: { en: 'Quietly waiting.', my: 'တိတ်တိတ်လေး စောင့်နေပါတယ်။' },
};

export function dialogueFor(name: PetStateName, locale: PetLocale = 'en'): string {
  return PET_DIALOGUE[name][locale];
}

export function hasDialogue(name: PetStateName): boolean {
  return PET_DIALOGUE[name].en.length > 0;
}

export const PET_STATE_LABELS: Record<PetStateName, PetMessage> = {
  hidden: { en: 'Hidden', my: 'ဝှက်ထားသည်' },
  greeting: { en: 'Greeting', my: 'နှုတ်ဆက်နေသည်' },
  idle: { en: 'Idle', my: 'အနားယူနေသည်' },
  reading: { en: 'Reading', my: 'ဖတ်နေသည်' },
  focused: { en: 'Focused', my: 'အာရုံစိုက်နေသည်' },
  thinking: { en: 'Thinking', my: 'တွေးနေသည်' },
  uploading: { en: 'Uploading', my: 'ဖိုလ်တင်နေသည်' },
  celebrating: { en: 'Celebrating', my: 'ဂုဏ်ယူနေသည်' },
  encouraging: { en: 'Encouraging', my: 'အားပေးနေသည်' },
  hinting: { en: 'Hinting', my: 'အကြမ်းဖျင်းပြနေသည်' },
  explaining: { en: 'Explaining', my: 'ရှင်းပြနေသည်' },
  searching: { en: 'Searching', my: 'ရှာဖွေနေသည်' },
  error: { en: 'Confused', my: 'ရှုပ်နေသည်' },
  sleeping: { en: 'Sleeping', my: 'အိပ်နေသည်' },
};

export function stateLabel(name: PetStateName, locale: PetLocale = 'en'): string {
  return PET_STATE_LABELS[name][locale];
}
