import { Book } from './types';

// Using standard Bible book IDs for API compatibility
export const BOOKS: Book[] = [
  // --- OLD TESTAMENT ---
  // Pentateuch
  {
    id: 'genesis',
    name: 'Genesis',
    testament: 'Old',
    themeColor: 'from-emerald-900 via-teal-900 to-black',
    chapterCount: 50
  },
  {
    id: 'exodus',
    name: 'Exodus',
    testament: 'Old',
    themeColor: 'from-orange-900 via-amber-900 to-black',
    chapterCount: 40
  },
  {
    id: 'leviticus',
    name: 'Leviticus',
    testament: 'Old',
    themeColor: 'from-yellow-900 via-orange-900 to-black',
    chapterCount: 27
  },
  {
    id: 'numbers',
    name: 'Numbers',
    testament: 'Old',
    themeColor: 'from-stone-800 via-stone-900 to-black',
    chapterCount: 36
  },
  {
    id: 'deuteronomy',
    name: 'Deuteronomy',
    testament: 'Old',
    themeColor: 'from-amber-900 via-yellow-900 to-black',
    chapterCount: 34
  },
  // History
  {
    id: 'joshua',
    name: 'Joshua',
    testament: 'Old',
    themeColor: 'from-red-900 via-orange-900 to-black',
    chapterCount: 24
  },
  {
    id: 'judges',
    name: 'Judges',
    testament: 'Old',
    themeColor: 'from-red-950 via-red-900 to-black',
    chapterCount: 21
  },
  {
    id: 'ruth',
    name: 'Ruth',
    testament: 'Old',
    themeColor: 'from-rose-900 via-pink-900 to-black',
    chapterCount: 4
  },
  {
    id: '1samuel',
    name: '1 Samuel',
    testament: 'Old',
    themeColor: 'from-blue-900 via-slate-900 to-black',
    chapterCount: 31
  },
  {
    id: '2samuel',
    name: '2 Samuel',
    testament: 'Old',
    themeColor: 'from-blue-900 via-slate-900 to-black',
    chapterCount: 24
  },
  {
    id: '1kings',
    name: '1 Kings',
    testament: 'Old',
    themeColor: 'from-amber-900 via-orange-900 to-black',
    chapterCount: 22
  },
  {
    id: '2kings',
    name: '2 Kings',
    testament: 'Old',
    themeColor: 'from-amber-900 via-orange-900 to-black',
    chapterCount: 25
  },
  {
    id: '1chronicles',
    name: '1 Chronicles',
    testament: 'Old',
    themeColor: 'from-stone-800 via-stone-900 to-black',
    chapterCount: 29
  },
  {
    id: '2chronicles',
    name: '2 Chronicles',
    testament: 'Old',
    themeColor: 'from-stone-800 via-stone-900 to-black',
    chapterCount: 36
  },
  {
    id: 'ezra',
    name: 'Ezra',
    testament: 'Old',
    themeColor: 'from-cyan-900 via-blue-900 to-black',
    chapterCount: 10
  },
  {
    id: 'nehemiah',
    name: 'Nehemiah',
    testament: 'Old',
    themeColor: 'from-cyan-900 via-blue-900 to-black',
    chapterCount: 13
  },
  {
    id: 'esther',
    name: 'Esther',
    testament: 'Old',
    themeColor: 'from-fuchsia-900 via-pink-900 to-black',
    chapterCount: 10
  },
  // Wisdom/Poetry
  {
    id: 'job',
    name: 'Job',
    testament: 'Old',
    themeColor: 'from-slate-900 via-gray-900 to-black',
    chapterCount: 42
  },
  {
    id: 'psalms',
    name: 'Psalms',
    testament: 'Old',
    themeColor: 'from-indigo-900 via-violet-900 to-black',
    chapterCount: 150
  },
  {
    id: 'proverbs',
    name: 'Proverbs',
    testament: 'Old',
    themeColor: 'from-amber-800 via-yellow-900 to-black',
    chapterCount: 31
  },
  {
    id: 'ecclesiastes',
    name: 'Ecclesiastes',
    testament: 'Old',
    themeColor: 'from-stone-800 via-gray-800 to-black',
    chapterCount: 12
  },
  {
    id: 'songofsolomon',
    name: 'Song of Solomon',
    testament: 'Old',
    themeColor: 'from-rose-900 via-pink-900 to-black',
    chapterCount: 8
  },
  // Major Prophets
  {
    id: 'isaiah',
    name: 'Isaiah',
    testament: 'Old',
    themeColor: 'from-red-900 via-orange-900 to-black',
    chapterCount: 66
  },
  {
    id: 'jeremiah',
    name: 'Jeremiah',
    testament: 'Old',
    themeColor: 'from-indigo-950 via-blue-950 to-black',
    chapterCount: 52
  },
  {
    id: 'lamentations',
    name: 'Lamentations',
    testament: 'Old',
    themeColor: 'from-gray-900 via-black to-black',
    chapterCount: 5
  },
  {
    id: 'ezekiel',
    name: 'Ezekiel',
    testament: 'Old',
    themeColor: 'from-orange-900 via-red-900 to-black',
    chapterCount: 48
  },
  {
    id: 'daniel',
    name: 'Daniel',
    testament: 'Old',
    themeColor: 'from-emerald-900 via-cyan-900 to-black',
    chapterCount: 12
  },
  // Minor Prophets
  {
    id: 'hosea',
    name: 'Hosea',
    testament: 'Old',
    themeColor: 'from-rose-900 via-red-900 to-black',
    chapterCount: 14
  },
  {
    id: 'joel',
    name: 'Joel',
    testament: 'Old',
    themeColor: 'from-green-900 via-emerald-900 to-black',
    chapterCount: 3
  },
  {
    id: 'amos',
    name: 'Amos',
    testament: 'Old',
    themeColor: 'from-stone-900 via-red-900 to-black',
    chapterCount: 9
  },
  {
    id: 'obadiah',
    name: 'Obadiah',
    testament: 'Old',
    themeColor: 'from-red-900 via-black to-black',
    chapterCount: 1
  },
  {
    id: 'jonah',
    name: 'Jonah',
    testament: 'Old',
    themeColor: 'from-blue-900 via-cyan-900 to-black',
    chapterCount: 4
  },
  {
    id: 'micah',
    name: 'Micah',
    testament: 'Old',
    themeColor: 'from-indigo-900 via-purple-900 to-black',
    chapterCount: 7
  },
  {
    id: 'nahum',
    name: 'Nahum',
    testament: 'Old',
    themeColor: 'from-red-900 via-black to-black',
    chapterCount: 3
  },
  {
    id: 'habakkuk',
    name: 'Habakkuk',
    testament: 'Old',
    themeColor: 'from-orange-900 via-red-900 to-black',
    chapterCount: 3
  },
  {
    id: 'zephaniah',
    name: 'Zephaniah',
    testament: 'Old',
    themeColor: 'from-purple-900 via-black to-black',
    chapterCount: 3
  },
  {
    id: 'haggai',
    name: 'Haggai',
    testament: 'Old',
    themeColor: 'from-stone-800 via-stone-900 to-black',
    chapterCount: 2
  },
  {
    id: 'zechariah',
    name: 'Zechariah',
    testament: 'Old',
    themeColor: 'from-emerald-900 via-teal-900 to-black',
    chapterCount: 14
  },
  {
    id: 'malachi',
    name: 'Malachi',
    testament: 'Old',
    themeColor: 'from-blue-900 via-indigo-900 to-black',
    chapterCount: 4
  },

  // --- NEW TESTAMENT ---
  {
    id: 'matthew',
    name: 'Matthew',
    testament: 'New',
    themeColor: 'from-orange-900 via-red-900 to-black',
    chapterCount: 28
  },
  {
    id: 'mark',
    name: 'Mark',
    testament: 'New',
    themeColor: 'from-red-900 via-rose-900 to-black',
    chapterCount: 16
  },
  {
    id: 'luke',
    name: 'Luke',
    testament: 'New',
    themeColor: 'from-blue-900 via-indigo-900 to-black',
    chapterCount: 24
  },
  {
    id: 'john',
    name: 'John',
    testament: 'New',
    themeColor: 'from-cyan-900 via-blue-900 to-black',
    chapterCount: 21
  },
  {
    id: 'acts',
    name: 'Acts',
    testament: 'New',
    themeColor: 'from-blue-900 via-slate-900 to-black',
    chapterCount: 28
  },
  {
    id: 'romans',
    name: 'Romans',
    testament: 'New',
    themeColor: 'from-emerald-900 via-green-900 to-black',
    chapterCount: 16
  },
  {
    id: '1corinthians',
    name: '1 Corinthians',
    testament: 'New',
    themeColor: 'from-violet-900 via-purple-900 to-black',
    chapterCount: 16
  },
  {
    id: '2corinthians',
    name: '2 Corinthians',
    testament: 'New',
    themeColor: 'from-violet-900 via-purple-900 to-black',
    chapterCount: 13
  },
  {
    id: 'galatians',
    name: 'Galatians',
    testament: 'New',
    themeColor: 'from-amber-900 via-yellow-900 to-black',
    chapterCount: 6
  },
  {
    id: 'ephesians',
    name: 'Ephesians',
    testament: 'New',
    themeColor: 'from-teal-900 via-emerald-900 to-black',
    chapterCount: 6
  },
  {
    id: 'philippians',
    name: 'Philippians',
    testament: 'New',
    themeColor: 'from-fuchsia-900 via-purple-900 to-black',
    chapterCount: 4
  },
  {
    id: 'colossians',
    name: 'Colossians',
    testament: 'New',
    themeColor: 'from-lime-900 via-green-900 to-black',
    chapterCount: 4
  },
  {
    id: '1thessalonians',
    name: '1 Thessalonians',
    testament: 'New',
    themeColor: 'from-slate-800 via-gray-900 to-black',
    chapterCount: 5
  },
  {
    id: '2thessalonians',
    name: '2 Thessalonians',
    testament: 'New',
    themeColor: 'from-slate-800 via-gray-900 to-black',
    chapterCount: 3
  },
  {
    id: '1timothy',
    name: '1 Timothy',
    testament: 'New',
    themeColor: 'from-amber-900 via-orange-900 to-black',
    chapterCount: 6
  },
  {
    id: '2timothy',
    name: '2 Timothy',
    testament: 'New',
    themeColor: 'from-amber-900 via-orange-900 to-black',
    chapterCount: 4
  },
  {
    id: 'titus',
    name: 'Titus',
    testament: 'New',
    themeColor: 'from-green-900 via-emerald-900 to-black',
    chapterCount: 3
  },
  {
    id: 'philemon',
    name: 'Philemon',
    testament: 'New',
    themeColor: 'from-blue-900 via-indigo-900 to-black',
    chapterCount: 1
  },
  {
    id: 'hebrews',
    name: 'Hebrews',
    testament: 'New',
    themeColor: 'from-red-900 via-orange-900 to-black',
    chapterCount: 13
  },
  {
    id: 'james',
    name: 'James',
    testament: 'New',
    themeColor: 'from-indigo-900 via-blue-900 to-black',
    chapterCount: 5
  },
  {
    id: '1peter',
    name: '1 Peter',
    testament: 'New',
    themeColor: 'from-cyan-900 via-teal-900 to-black',
    chapterCount: 5
  },
  {
    id: '2peter',
    name: '2 Peter',
    testament: 'New',
    themeColor: 'from-cyan-900 via-teal-900 to-black',
    chapterCount: 3
  },
  {
    id: '1john',
    name: '1 John',
    testament: 'New',
    themeColor: 'from-rose-900 via-pink-900 to-black',
    chapterCount: 5
  },
  {
    id: '2john',
    name: '2 John',
    testament: 'New',
    themeColor: 'from-rose-900 via-pink-900 to-black',
    chapterCount: 1
  },
  {
    id: '3john',
    name: '3 John',
    testament: 'New',
    themeColor: 'from-rose-900 via-pink-900 to-black',
    chapterCount: 1
  },
  {
    id: 'jude',
    name: 'Jude',
    testament: 'New',
    themeColor: 'from-purple-900 via-violet-900 to-black',
    chapterCount: 1
  },
  {
    id: 'revelation',
    name: 'Revelation',
    testament: 'New',
    themeColor: 'from-fuchsia-900 via-purple-900 to-black',
    chapterCount: 22
  }
];