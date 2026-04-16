export default {
  name: 'grammarBlock',
  title: 'Grammar Focus Block',
  type: 'object',
  fields: [
    {
      name: 'rule',
      title: 'Grammar Rule Title',
      type: 'string',
      description: 'e.g., "Relative Clauses"'
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'string',
      initialValue: 'Review the grammar rule below.',
    },
    {
      name: 'explanation',
      title: 'Explanation',
      type: 'text',
      rows: 4,
    },
    {
      name: 'example',
      title: 'Contextual Example',
      type: 'string',
      description: 'Pull a sentence from the text. Wrap the target grammar in **asterisks** to make it bold (e.g., "The man **who** called was angry").'
    }
  ],
  preview: {
    select: { title: 'rule' },
    prepare(selection) { return { title: `📝 Grammar: ${selection.title || ''}` } }
  }
};