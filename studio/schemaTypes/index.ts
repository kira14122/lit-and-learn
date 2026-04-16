import review from './review'
import resource from './resource'
import dictionaryWord from './dictionaryWord'
import quizQuestion from './quizQuestion'
import comprehensionBlock from './comprehensionBlock' // <-- 1. Add this import line at the top
import interactiveLesson from './interactiveLesson'
import warmUpBlock from './warmUpBlock'
import inductiveGrammarBlock from './inductiveGrammarBlock'
import readingBlock from './readingBlock'
import vocabBlock from './vocabBlock'
import grammarBlock from './grammarBlock'

export const schemaTypes = [
  review, 
  resource, 
  dictionaryWord, 
  quizQuestion,
  comprehensionBlock, // <-- 2. Add it to the array here (make sure there is a comma after quizQuestion)
  interactiveLesson,
  warmUpBlock,
  inductiveGrammarBlock,
  readingBlock,
  vocabBlock,
  grammarBlock
]