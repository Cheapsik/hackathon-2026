import { Link, useParams } from 'react-router'
import { useGetApiAdminGrantCallsGrantCallIdApplications } from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** Draft applications the Kreator wrote for one grant call, with how many criteria each one already answers. */
export function GrantCallApplicationsPage() {
  usePageTitle('Wnioski do naboru')
  const { grantCallId = '' } = useParams()
  const applications = useGetApiAdminGrantCallsGrantCallIdApplications(grantCallId)
  const rows = applications.data?.data ?? []

  return (
    <>
      <p>
        <Link to="/admin/nabory">Nabory</Link>
      </p>
      <h1>Wnioski do naboru</h1>
      <div aria-live="polite">
        {applications.isPending && (
          <p>
            <output>Wczytuję wnioski…</output>
          </p>
        )}
        {applications.isError && <p role="alert">{errorMessage(applications.error, { 404: 'Nie znaleźliśmy tego naboru.' })}</p>}
        {applications.isSuccess && rows.length === 0 && <p>Do tego naboru nie przygotowano jeszcze wniosków.</p>}
      </div>
      {rows.length > 0 && (
        <table>
          <caption>Wnioski ({rows.length})</caption>
          <thead>
            <tr>
              <th scope="col">Tytuł</th>
              <th scope="col">Pomysł</th>
              <th scope="col">Uzupełnione kryteria</th>
              <th scope="col">Ostatnia zmiana</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <Link to={`/wnioski/${row.id}`}>{row.title}</Link>
                </th>
                <td>
                  <Link to={`/pomysly/${row.ideaId}`}>{row.ideaTitle}</Link>
                </td>
                <td>
                  {row.answeredCriteria} z {row.criteria}
                </td>
                <td>{formatDateTime(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
