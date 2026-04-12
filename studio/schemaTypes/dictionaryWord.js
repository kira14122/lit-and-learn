export default {
  name: 'dictionaryWord',
  title: 'Dictionary Word',
  type: 'document',
  fields: [
    {
      name: 'word',
      title: 'Vocabulary Word',
      type: 'string',
      description: 'The word exactly as it appears in the text (e.g., existentialism)',
      validation: (Rule) => Rule.required().lowercase(),
    },
    {
      name: 'pos',
      title: 'Part of Speech',
      type: 'string',
      options: {
        list: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction'],
        layout: 'radio' // Makes it a nice clickable button list!
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'definition',
      title: 'Definition',
      type: 'text',
      description: 'A contextual, B2/C1 level definition suitable for your students.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'level',
      title: 'CEFR Level',
      type: 'string',
      options: {
        list: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        layout: 'radio'
      },
      validation: (Rule) => Rule.required(),
    }
  ]
}