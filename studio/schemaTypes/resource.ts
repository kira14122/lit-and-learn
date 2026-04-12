export default {
  name: 'resource',
  type: 'document',
  title: 'Lesson Resources',
  fields: [
    { 
      name: 'title', 
      type: 'string', 
      title: 'Resource Name' 
    },
    {
      name: 'isGeneral',
      type: 'boolean',
      title: 'Is this a General Resource?',
      description: 'Turn this ON for global guides (like Irregular Verbs). Leave it OFF for specific English Corner lessons.',
      initialValue: false
    },
    {
      name: 'level',
      type: 'string',
      title: 'Main Level',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      hidden: ({document}: any) => document?.isGeneral
    },
    {
      name: 'subLevel',
      type: 'string',
      title: 'Sub-Level (e.g., Level 1, Level 2)',
      hidden: ({document}: any) => document?.isGeneral
    },
    {
      name: 'unit',
      type: 'number',
      title: 'Unit Number (1-12)',
      hidden: ({document}: any) => document?.isGeneral
    },
    {
      name: 'category',
      type: 'string',
      title: 'Category',
      options: { list: ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Writing'] },
      hidden: ({document}: any) => document?.isGeneral
    },
    { 
      name: 'file', 
      type: 'file', 
      title: 'Resource File (PDF)',
      description: 'Upload the worksheet or reading material here.' 
    },
    // --- THE NEW AUDIO FIELD IS SAFELY INSIDE THE LIST NOW ---
    {
      name: 'audio',
      title: 'Audio File (MP3/WAV)',
      type: 'file',
      options: {
        accept: 'audio/*'
      },
      description: 'Optional: Upload a listening exercise, dictation, or pronunciation guide.'
    }
  ],
  
  // --- THE DASHBOARD PREVIEW UPGRADE ---
  preview: {
    select: {
      title: 'title',
      isGeneral: 'isGeneral',
      level: 'level',
      unit: 'unit',
      category: 'category'
    },
    prepare(selection: any) {
      const { title, isGeneral, level, unit, category } = selection;
      
      // If the General toggle is ON, show "Global Resource"
      // If it's OFF, show "Intermediate - Unit 4 (Grammar)"
      const formattedSubtitle = isGeneral 
        ? 'Global Resource' 
        : `${level || 'No Level'} - Unit ${unit || '?'} (${category || 'No Category'})`;

      return {
        title: title || 'Untitled Resource',
        subtitle: formattedSubtitle
      }
    }
  }
}