export default {
  name: 'unitMetadata',
  title: 'Unit Overviews',
  type: 'document',
  fields: [
    {
      name: 'level',
      title: 'Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'subLevel',
      title: 'Path / Sub-Level',
      type: 'string',
      options: { list: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Business English'] },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'unitNumber',
      title: 'Unit Number',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(1).max(12)
    },
    {
      name: 'title',
      title: 'Unit Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'description',
      title: 'Unit Description',
      type: 'text',
      rows: 3
    },
    {
      name: 'objectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ],
  preview: {
    select: { title: 'title', level: 'level', subLevel: 'subLevel', unit: 'unitNumber' },
    prepare(selection: any) {
      const { title, level, subLevel, unit } = selection;
      return { 
        title: `Unit ${unit}: ${title}`, 
        subtitle: `${level} - ${subLevel}` 
      }
    }
  }
}