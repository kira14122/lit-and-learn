export default {
  name: 'vocabBlock',
  title: 'Vocabulary Match Block',
  type: 'object',
  fields: [
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'string',
      initialValue: 'Match the vocabulary words from the text to their correct definitions.',
    },
    {
      name: 'vocabPairs',
      title: 'Vocabulary Pairs',
      type: 'array',
      description: 'Add the words and their definitions here.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'word', title: 'Word', type: 'string' },
            { name: 'definition', title: 'Definition', type: 'text', rows: 2 }
          ],
          preview: { select: { title: 'word', subtitle: 'definition' } }
        }
      ]
    }
  ],
  preview: {
    select: { title: 'instruction' },
    prepare() { return { title: '🔤 Vocabulary Match' } }
  }
};