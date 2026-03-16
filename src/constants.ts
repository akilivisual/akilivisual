import { Book } from './types';

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY3y4-sREU8TZrzbx5yXxwRSCnwXrdYbBMGpVtRVy_BigiW_a9B06QIDXfomLnPwmge3dJsk93rGfjc5aD-EHXbpUsxTrmx7N6w6xiEDDVBQ_ROguoMhDlL_JHrXn6Suu5hBRlmcbCj6OnZY4pXIZLW3RusNpYnXjH1_KG_rdsmQDkEY8nHXDkooKAZASud-TBgYVneWtUHHTKhgmw_-3O_lkDvPqpsHEyOHs_gJfzwVqP5fimLnqnERC2zmhDhMHLBZMV0bfuLFei',
    progress: 75,
    category: 'Classic',
    content: 'In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since...',
    chapters: [
      { id: 'c1', title: 'Chapter 1', content: 'In my younger and more vulnerable years...' },
      { id: 'c2', title: 'Chapter 2', content: 'About half way between West Egg and New York...' },
      { id: 'c3', title: 'Chapter 3: The Party', content: 'There was music from my neighbor’s house through the summer nights...' }
    ]
  },
  {
    id: '2',
    title: 'The Silent Echo',
    author: 'Elena Rossi',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBY-cWNqxKjITi5q7_HxtjFEb1Snaio0Iq7bRx7oQG6uw8VFk6jaEeMJ3qqBL4h2kz3jjFSaxIQFDiQi_iEVwtCisUATmr5nMBBJSw9hu9xKlj26BJIODFvd48dKy3IwpL4MFL8ilWiSx7LKXhn306kWu0q8tBReH8TmK6KN5UMMfgt_PcG3kVQ8hyR6JEPRTmiJ6Z9s-deK9I-vmq2KcUkck4kYI9DHnaZDZxS0sTibpT4H_dpZLc5na6hFDwHYkSKCcRxm85ARmKR',
    progress: 20,
    category: 'Mystery',
    content: 'The lighthouse stood as a silent sentinel against the crashing waves...',
    chapters: [
      { id: 'c1', title: 'Chapter 1', content: 'The lighthouse stood as a silent sentinel...' }
    ]
  },
  {
    id: '3',
    title: 'The Obsidian Mirror',
    author: 'Julian Blackwood',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwiwweJHaHAingmVfWk0FzZFf7P3EK5vQdabmHnoNNCxLWteCgBoSpMiq-1y6sNu94LkMGZX7A-GQjwW4DVoZ5_21Gke6jWvPsmFJvau_bM7GxENwH2_EoIeww7nxJLhp1uQu8SI8Ws2H5KUxJ0z0eRl-8kLNxG79uaPaqim-ov3_uhYF46eyEa2XVPl_8ptxLo-vK-yxZ3qI3gEsaLMZ1kjFos5EGfKT5XOWBUFtZ2v6g10Y4AShnrp8h7dnFo4cnq1gyD4D3b8oL',
    progress: 45,
    category: 'Fantasy',
    content: 'The sun had dipped below the horizon hours ago, leaving the valley in a deep, sapphire gloom...',
    chapters: [
      { id: 'c1', title: 'Chapter 1', content: 'The sun had dipped below the horizon...' },
      { id: 'c4', title: 'Chapter 4: The Obsidian Mirror', content: 'The sun had dipped below the horizon hours ago, leaving the valley in a deep, sapphire gloom. Elara adjusted her cloak, the heavy wool scratching against her neck as she peered into the reflective surface of the Obsidian Mirror.' }
    ]
  }
];
