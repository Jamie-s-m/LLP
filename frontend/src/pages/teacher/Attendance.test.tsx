import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import Attendance from './Attendance'
import { useLanguageStore } from '../../store/languageStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const GROUP_ID = 'group-1'

const GROUPS_RESPONSE = {
  data: {
    data: [
      {
        _id: GROUP_ID,
        name: 'Evening Conversation Club',
        members: [
          { _id: 'student-1', firstName: 'Aziza', lastName: 'Karimova' },
          { _id: 'student-2', firstName: 'Bekzod', lastName: 'Yusupov' },
        ],
      },
      {
        _id: 'group-2',
        name: 'Other Group',
        members: [{ _id: 'student-9', firstName: 'Nobody', lastName: 'Else' }],
      },
    ],
  },
}

const HISTORY_RESPONSE = {
  data: {
    data: [
      {
        _id: 'record-1',
        group: GROUP_ID,
        student: { _id: 'student-1', firstName: 'Aziza', lastName: 'Karimova', email: 'aziza@example.com' },
        date: '2026-08-25T00:00:00.000Z',
        status: 'present',
        notes: '',
        markedBy: 'teacher-1',
      },
      {
        _id: 'record-2',
        group: GROUP_ID,
        student: { _id: 'student-2', firstName: 'Bekzod', lastName: 'Yusupov', email: 'bekzod@example.com' },
        date: '2026-08-25T00:00:00.000Z',
        status: 'absent',
        notes: '',
        markedBy: 'teacher-1',
      },
    ],
  },
}

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/teacher/groups/${GROUP_ID}/attendance`]}>
      <Routes>
        <Route path="/teacher/groups/:groupId/attendance" element={<Attendance />} />
      </Routes>
    </MemoryRouter>
  )

describe('Attendance page', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'en' })
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/groups') return Promise.resolve(GROUPS_RESPONSE)
      if (url === `/attendance/${GROUP_ID}`) return Promise.resolve(HISTORY_RESPONSE)
      return Promise.resolve({ data: { data: {} } })
    })
    mockedApi.post.mockResolvedValue({ data: { data: { marked: [], skipped: [] } } })
  })

  it('renders real member names from the matched group', async () => {
    renderAt()

    expect(await screen.findByText('Evening Conversation Club')).toBeInTheDocument()
    // Aziza and Bekzod also show up again in the history section below (same students,
    // past records), so assert presence rather than a single unique match.
    expect((await screen.findAllByText('Aziza Karimova')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bekzod Yusupov').length).toBeGreaterThan(0)
    expect(screen.queryByText('Nobody Else')).not.toBeInTheDocument()
  })

  it('posts a records array covering the group members when Save attendance is clicked', async () => {
    const user = userEvent.setup()
    renderAt()

    await screen.findAllByText('Aziza Karimova')

    await user.click(screen.getByRole('button', { name: 'Save attendance' }))

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1))
    const [url, body] = mockedApi.post.mock.calls[0]
    expect(url).toBe(`/attendance/${GROUP_ID}`)
    expect(body.date).toEqual(expect.any(String))
    expect(body.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ studentId: 'student-1', status: 'present' }),
        expect.objectContaining({ studentId: 'student-2', status: 'present' }),
      ])
    )
    expect(body.records).toHaveLength(2)
  })

  it('renders past attendance records grouped by date in the history section', async () => {
    renderAt()

    expect(await screen.findByText('2026-08-25')).toBeInTheDocument()
    const historyPresent = screen.getAllByText('Present')
    const historyAbsent = screen.getAllByText('Absent')
    expect(historyPresent.length).toBeGreaterThan(0)
    expect(historyAbsent.length).toBeGreaterThan(0)
  })

  it('shows a per-student summary inline after clicking their name', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/groups') return Promise.resolve(GROUPS_RESPONSE)
      if (url === `/attendance/${GROUP_ID}`) return Promise.resolve(HISTORY_RESPONSE)
      if (url === `/attendance/${GROUP_ID}/summary/student-1`) {
        return Promise.resolve({
          data: {
            data: {
              groupId: GROUP_ID,
              studentId: 'student-1',
              totalSessions: 5,
              counts: { present: 4, absent: 1, late: 0, excused: 0 },
              attendanceRate: 80,
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    const user = userEvent.setup()
    renderAt()

    const nameButtons = await screen.findAllByRole('button', { name: /Aziza Karimova/ })
    await user.click(nameButtons[0])

    expect(await screen.findByText('80%')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
