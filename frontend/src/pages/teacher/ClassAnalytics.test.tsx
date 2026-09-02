import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import ClassAnalytics from './ClassAnalytics'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const COURSE_ID = 'course-1'

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/teacher/course/${COURSE_ID}/analytics`]}>
      <Routes>
        <Route path="/teacher/course/:courseId/analytics" element={<ClassAnalytics />} />
      </Routes>
    </MemoryRouter>
  )

describe('ClassAnalytics', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
  })

  it('renders the header stats from the class-analytics response', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/progress/class-analytics/${COURSE_ID}`) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              courseId: COURSE_ID,
              courseTitle: 'Everyday English',
              studentCount: 2,
              classAverageCompletion: 62,
              students: [
                {
                  studentId: 'student-1',
                  name: 'Aziza Karimova',
                  completionPercentage: 80,
                  isCompleted: false,
                  skillMastery: [],
                  weakSkillCount: 0,
                },
                {
                  studentId: 'student-2',
                  name: 'Bekzod Yusupov',
                  completionPercentage: 40,
                  isCompleted: false,
                  skillMastery: [],
                  weakSkillCount: 1,
                },
              ],
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText('Everyday English')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('sorts students by weakSkillCount descending, with the highest-attention student surfacing first', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/progress/class-analytics/${COURSE_ID}`) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              courseId: COURSE_ID,
              courseTitle: 'Everyday English',
              studentCount: 2,
              classAverageCompletion: 50,
              // Given in the opposite order from the expected sort: low-attention student first.
              students: [
                {
                  studentId: 'student-low',
                  name: 'Low Attention Student',
                  completionPercentage: 90,
                  isCompleted: false,
                  skillMastery: [],
                  weakSkillCount: 0,
                },
                {
                  studentId: 'student-high',
                  name: 'High Attention Student',
                  completionPercentage: 30,
                  isCompleted: false,
                  skillMastery: [],
                  weakSkillCount: 3,
                },
              ],
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    await screen.findByText('Everyday English')
    const rows = screen.getAllByRole('row').slice(1) // drop the header row
    const rowNames = rows.map((row) => row.textContent || '')

    expect(rowNames[0]).toContain('High Attention Student')
    expect(rowNames[1]).toContain('Low Attention Student')
  })

  it('shows an error state instead of throwing when the teacher does not manage the course (403)', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/progress/class-analytics/${COURSE_ID}`) {
        const error = {
          response: { status: 403, data: { message: 'You do not manage this course' } },
        }
        return Promise.reject(error)
      }
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText(/do not manage this course/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
