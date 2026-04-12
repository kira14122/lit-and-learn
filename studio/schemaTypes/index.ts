import review from './review'
import resource from './resource'
import dictionaryWord from './dictionaryWord'
import quizQuestion from './quizQuestion' // <-- 1. ADD THIS LINE

export const schemaTypes = [
  review, 
  resource, 
  dictionaryWord, 
  quizQuestion // <-- 2. ADD THIS LINE (Don't forget the comma on the line above it!)
]