import { useEffect, useState } from 'react'
import { FiVolume2, FiRotateCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import { useAuthStore } from '../../store/authStore'
import { track } from '../../utils/analytics'
import ProgressBar from '../../components/ui/ProgressBar'
import Illustration from '../../components/illustrations/Illustration'

interface FlashcardItem {
  _id: string
  front: { text: string }
  back: { text: string }
}

const copy = {
  en: { kicker: 'Recall practice', title: 'Vocabulary Flashcards', text: 'Master vocabulary with spaced repetition and a focused card-by-card review flow.', loading: 'Loading flashcards...', empty: 'No flashcards available yet. Check back soon!', allCaughtUp: "You're all caught up! No cards are due right now — check back later.", card: 'Card {current} of {total} due', deckSize: '{total} total in your deck', masteredCount: '{count} reviewed', front: 'FRONT', back: 'BACK', previous: 'Previous', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', flipFirst: 'Flip the card to rate it', next: 'Next', earned: '+{xp} XP, +{coins} coins', reviewFailed: 'Could not save this review — check your connection and try again.' },
  ru: { kicker: 'Практика запоминания', title: 'Словарные карточки', text: 'Осваивайте лексику через интервальные повторения и спокойный режим карточка за карточкой.', loading: 'Загрузка карточек...', empty: 'Карточек пока нет. Загляните позже!', allCaughtUp: 'Вы всё повторили! Сейчас нет карточек к повторению — загляните позже.', card: 'Карточка {current} из {total} к повторению', deckSize: 'Всего в колоде: {total}', masteredCount: 'Пройдено: {count}', front: 'ЛИЦО', back: 'ОБОРОТ', previous: 'Назад', again: 'Заново', hard: 'Сложно', good: 'Хорошо', easy: 'Легко', flipFirst: 'Переверните карточку, чтобы оценить', next: 'Далее', earned: '+{xp} XP, +{coins} монет', reviewFailed: 'Не удалось сохранить оценку — проверьте соединение и попробуйте снова.' },
  uz: { kicker: 'Eslab qolish mashqi', title: 'Lug‘at kartochkalari', text: 'Intervalli takrorlash va bitta-bitta ko‘rib chiqish oqimi bilan lug‘atni mustahkamlang.', loading: 'Kartochkalar yuklanmoqda...', empty: 'Hali kartochkalar yo‘q. Keyinroq qayta tekshiring!', allCaughtUp: 'Hammasi bajarildi! Hozircha takrorlash uchun kartochka yo‘q — keyinroq qayting.', card: '{total} tadan {current}-kartochka (takrorlash uchun)', deckSize: 'To‘plamda jami: {total}', masteredCount: '{count} tasi ko‘rib chiqildi', front: 'OLD', back: 'ORQA', previous: 'Oldingi', again: 'Qayta', hard: 'Qiyin', good: 'Yaxshi', easy: 'Oson', flipFirst: 'Baholash uchun kartochkani ag‘daring', next: 'Keyingi', earned: '+{xp} XP, +{coins} tanga', reviewFailed: 'Baholashni saqlab bo‘lmadi — internetni tekshirib, qayta urinib ko‘ring.' },
} as const

type Rating = 'again' | 'hard' | 'good' | 'easy'

const RATING_STYLES: Record<Rating, string> = {
  again: 'border-[var(--error)] text-[var(--error)] hover:bg-[var(--error-light)]',
  hard: 'border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning-light)]',
  good: 'border-[var(--info)] text-[var(--info)] hover:bg-[var(--info-light)]',
  easy: 'border-[var(--success)] text-[var(--success)] hover:bg-[var(--success-light)]',
}

export default function Flashcards() {
  const [cards, setCards] = useState<FlashcardItem[]>([])
  const [deckTotal, setDeckTotal] = useState(0)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    api.get('/flashcards')
      .then((response) => {
        setCards(response.data.data || [])
        setDeckTotal(response.data.meta?.totalCount ?? (response.data.data || []).length)
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center"><div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">{ui.loading}</div></div>
  }

  if (cards.length === 0) {
    const caughtUp = deckTotal > 0
    return (
      <div className="atlas-page px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl atlas-panel p-8">
          <div className="mx-auto mb-4 h-32 w-32">
            <Illustration name={caughtUp ? 'celebration' : 'empty'} className="h-full w-full" />
          </div>
          <p className="text-muted">{caughtUp ? ui.allCaughtUp : ui.empty}</p>
        </div>
      </div>
    )
  }

  const activeCards = cards
  const card = activeCards[currentCard]
  const totalCards = activeCards.length

  const goToNextCard = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1)
    } else {
      setCurrentCard(0)
    }
    setIsFlipped(false)
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const handleRate = async (rating: Rating) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const response = await api.post(`/flashcards/${card._id}/review`, { rating })
      setReviewed((prev) => new Set(prev).add(card._id))
      track('flashcard_reviewed', { rating })
      const { xpAwarded, coinsAwarded, totalXp, totalLinguaCoins } = response.data.data || {}
      if (xpAwarded || coinsAwarded) {
        toast.success(
          ui.earned
            .replace('{xp}', String(xpAwarded ?? 0))
            .replace('{coins}', String(coinsAwarded ?? 0))
        )
      }
      if (user && (typeof totalXp === 'number' || typeof totalLinguaCoins === 'number')) {
        setUser({
          ...user,
          xp: typeof totalXp === 'number' ? totalXp : user.xp,
          linguaCoins: typeof totalLinguaCoins === 'number' ? totalLinguaCoins : user.linguaCoins,
        })
      }
      goToNextCard()
    } catch {
      toast.error(ui.reviewFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="atlas-heading mb-8 text-center">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p className="mx-auto">{ui.text}</p>
        </div>

        <div className="atlas-panel mb-8 p-5">
          <div className="mb-1 flex items-end justify-between gap-3">
            <span className="text-h3 text-[var(--text-primary)]">
              {ui.card.replace('{current}', String(currentCard + 1)).replace('{total}', String(totalCards))}
            </span>
            <span className="text-sm font-medium text-muted">{ui.masteredCount.replace('{count}', String(reviewed.size))}</span>
          </div>
          {deckTotal > totalCards ? (
            <p className="mb-2 text-xs text-muted">{ui.deckSize.replace('{total}', String(deckTotal))}</p>
          ) : null}
          <ProgressBar value={((currentCard + 1) / totalCards) * 100} />
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
              className="w-full h-full rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 flex flex-col items-center justify-center text-[var(--text-primary)] absolute shadow-sm"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-sm opacity-75 mb-4">{ui.front}</p>
              <p className="text-4xl font-bold text-center">{card.front.text}</p>
            </div>
            <div
              className="w-full h-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-center justify-center text-[var(--text-primary)] absolute shadow-sm"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-sm opacity-75 mb-4">{ui.back}</p>
              <p className="text-2xl text-center">{card.back.text}</p>
            </div>
          </div>
        </div>

        <div className="atlas-panel space-y-4 p-5">
          <div className="flex justify-center gap-4">
            <button aria-label="Play pronunciation" className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <FiVolume2 size={24} className="text-primary-500" />
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              aria-label="Flip card"
              className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <FiRotateCw size={24} className="text-secondary-500" />
            </button>
          </div>

          {isFlipped ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['again', 'hard', 'good', 'easy'] as Rating[]).map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  disabled={submitting}
                  className={`rounded-xl border-2 bg-transparent px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${RATING_STYLES[rating]}`}
                >
                  {ui[rating]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--text-muted)]">{ui.flipFirst}</p>
          )}

          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentCard === 0}
              className="flex-1 btn btn-outline"
            >
              {ui.previous}
            </button>
            <button
              onClick={goToNextCard}
              className="flex-1 btn btn-outline"
            >
              {ui.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
