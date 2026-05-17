export default {
  name: 'practiceBank',
  type: 'document',
  title: 'Practice Hub (Bulk Data)',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Topic Name',
      description: 'e.g., Present Simple vs. Present Continuous'
    },
    {
      name: 'category',
      type: 'string',
      title: 'Skill Category',
      options: { 
        list: ['Grammar', 'Vocabulary', 'Pronunciation'], // <-- Added Pronunciation
        layout: 'radio' // <-- Makes it a clean button row in the studio
      }
    },
    {
      name: 'level',
      type: 'string',
      title: 'Difficulty Level',
      options: { 
        list: ['Beginner', 'Intermediate', 'Advanced'],
        layout: 'radio' 
      }
    },
    {
      name: 'bulkData',
      type: 'text',
      title: 'Bulk Excel Paste',
      description: 'Copy your rows directly from Excel/Google Sheets and paste them here. Do NOT include the header row. Columns MUST be in this exact order: Question | Option A | Option B | Option C | Correct Answer (A, B, or C) | Explanation',
      rows: 15
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      level: 'level'
    },
    prepare(selection: any) {
      const { title, subtitle, level } = selection;
      return {
        title: title,
        subtitle: `${level} • ${subtitle}`
      }
    }
  }
}