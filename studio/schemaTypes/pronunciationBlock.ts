export default {
  name: 'pronunciationBlock',
  title: 'Pronunciation Clinic',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Pronunciation Clinic',
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      initialValue: 'Click on the words below to hear their pronunciation and see the phonetic transcriptions.',
    },
    {
      name: 'pronunciationWords',
      title: 'Target Words',
      type: 'array',
      description: 'Add words here. You can upload custom audio files (like those generated from Azure or CapCut) for both dialects.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'word',
              title: 'Target Word',
              type: 'string',
            },
            {
              name: 'definition',
              title: 'Brief Definition',
              type: 'string',
            },
            // AMERICAN ENGLISH DATA
            {
              name: 'ipaAmerican',
              title: 'American IPA Transcription',
              type: 'string',
              description: 'e.g., /skedʒ.uːl/'
            },
            {
              name: 'audioAmerican',
              title: 'American Pronunciation (Upload MP3)',
              type: 'file',
              options: { accept: 'audio/*' }
            },
            // BRITISH ENGLISH DATA
            {
              name: 'ipaBritish',
              title: 'British IPA Transcription',
              type: 'string',
              description: 'e.g., /ʃedʒ.uːl/'
            },
            {
              name: 'audioBritish',
              title: 'British Pronunciation (Upload MP3)',
              type: 'file',
              options: { accept: 'audio/*' }
            }
          ],
          preview: {
            select: { title: 'word' },
            prepare(selection: any) {
              return { title: `🗣️ ${selection.title || 'New Word'}` }
            }
          }
        }
      ]
    }
  ]
};