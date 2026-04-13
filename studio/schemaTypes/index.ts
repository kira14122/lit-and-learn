import review from './review'
import resource from './resource'
import dictionaryWord from './dictionaryWord'
import quizQuestion from './quizQuestion'
import comprehensionBlock from './comprehensionBlock' // <-- 1. Add this import line at the top

export const schemaTypes = [
  review, 
  resource, 
  dictionaryWord, 
  quizQuestion,
  comprehensionBlock // <-- 2. Add it to the array here (make sure there is a comma after quizQuestion)
]