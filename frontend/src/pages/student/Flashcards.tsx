import { useEffect, useState } from 'react'
import { FiVolume2, FiRotateCw } from 'react-icons/fi'
import api from '../../services/api'

interface FlashcardItem {
  _id: string
  front: { text: string }
  back: { text: string }
}

export default function Flashcards() {
  const [cards, setCards] = useState<FlashcardItem[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastered, setMastered] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/flashcards')
      .then((response) => setCards(response.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center"><div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">Loading flashcards...</div></div>
  }

  if (cards.length === 0) {
    return (
      <div className="atlas-page px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">No flashcards available yet. Check back soon!</div>
      </div>
    )
  }

  const card = cards[currentCard]
  const isMastered = mastered.includes(card._id)

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const handleMastered = () => {
    if (isMastered) {
      setMastered(mastered.filter((id) => id !== card._id))
    } else {
      setMastered([...mastered, card._id])
      api.get(`/flashcards/${card._id}/review`).catch(() => {})
    }
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="atlas-heading mb-8 text-center">
          <p className="atlas-kicker">Recall practice</p>
          <h1>Vocabulary Flashcards</h1>
          <p className="mx-auto">Master vocabulary with spaced repetition and a focused card-by-card review flow.</p>
        </div>

        <div className="atlas-panel mb-8 p-5">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span>Card {currentCard + 1} of {cards.length}</span>
            <span>{mastered.length} mastered</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="h-64 mb-8 cursor-pointer perspective"
        >
          <div
            className={`w-full h-full transition-transform duration-500 transform rounded-xl shadow-2xl flex items-center justify-center ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl p-8 flex flex-col items-center justify-center text-white absolute"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-sm opacity-75 mb-4">FRONT</p>
              <p className="text-4xl font-bold text-center">{card.front.text}</p>
            </div>
            <div
              className="w-full h-full bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl p-8 flex flex-col items-center justify-center text-white absolute"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-sm opacity-75 mb-4">BACK</p>
              <p className="text-2xl text-center">{card.back.text}</p>
            </div>
          </div>
        </div>

        <div className="atlas-panel space-y-4 p-5">
          <div className="flex justify-center gap-4">
            <button className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <FiVolume2 size={24} className="text-primary-500" />
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <FiRotateCw size={24} className="text-secondary-500" />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentCard === 0}
              className="flex-1 btn btn-outline"
            >
              Previous
            </button>
            <button
              onClick={handleMastered}
              className={`flex-1 btn ${isMastered ? 'btn-primary' : 'btn-outline'}`}
            >
              {isMastered ? '✓ Mastered' : 'Mark Mastered'}
            </button>
            <button
              onClick={handleNext}
              disabled={currentCard === cards.length - 1}
              className="flex-1 btn btn-primary"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
