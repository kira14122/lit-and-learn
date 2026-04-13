export default {
  name: 'dictionaryWord',
  title: 'Dictionary Vault',
  type: 'document',
  fields: [
    {
      name: 'word',
      title: 'Word, Phrasal Verb, or Idiom',
      type: 'string',
      description: 'Make sure there are no accidental spaces at the end!',
      validation: Rule => Rule.required()
    },
    {
      name: 'pos',
      title: 'Part of Speech',
      type: 'string',
      options: {
        list: [
          'Noun',
          'Verb',
          'Adjective',
          'Adverb',
          'Pronoun',
          'Preposition',
          'Conjunction',
          'Interjection',
          'Phrasal Verb',
          'Idiom'
        ],
        layout: 'dropdown'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'definition',
      title: 'Definition & Context',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    },
    {
      name: 'level',
      title: 'CEFR Level',
      type: 'string',
      options: {
        list: [
          'A1', 
          'A2', 
          'B1', 
          'B2', 
          'C1', 
          'C2'
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'word',
      subtitle: 'pos',
      level: 'level'
    },
    prepare(selection) {
      const { title, subtitle, level } = selection;
      return {
        title: title,
        subtitle: `${subtitle} | ${level}`
      }
    }
  }
}