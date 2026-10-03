import { Link } from 'react-router'
import { useGetApiChallengeAreas } from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** The Atlas home: the eight areas of the Social Challenges Map. */
export function AreasPage() {
  usePageTitle('Atlas wyzwań')
  const areas = useGetApiChallengeAreas()

  return (
    <>
      <h1>Atlas wyzwań</h1>
      <p>
        Osiem obszarów Mapy Wyzwań Społecznych ROPS. Dane opisów są krajowe. Wybierz obszar, żeby zobaczyć personę, dane
        swojej gminy i pasujące innowacje.
      </p>
      <p>
        <Link to="/biblioteka">Biblioteka innowacji</Link>
        {' · '}
        <Link to="/mapa">Mapa gminy</Link>
        {' · '}
        <Link to="/materialy">Materiały edukacyjne</Link>
      </p>
      <div aria-live="polite">
        {areas.isPending && (
          <p>
            <output>Wczytuję obszary…</output>
          </p>
        )}
        {areas.isError && <p role="alert">{errorMessage(areas.error)}</p>}
      </div>
      <ul>
        {(areas.data?.data ?? []).map((area) => (
          <li key={area.code}>
            <h2>
              <Link to={`/obszary/${area.code}`}>
                {area.number}. {area.name}
              </Link>
            </h2>
            <p>{area.definition.slice(0, 280)}…</p>
          </li>
        ))}
      </ul>
    </>
  )
}
