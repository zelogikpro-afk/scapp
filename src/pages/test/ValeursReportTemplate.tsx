import { forwardRef } from 'react'
import { VALEURS, type Valeur, type ValeurKey } from '../../data/testValeursData'

export const PAGE_W = 595
export const PAGE_H = 842

const PROFILE_TEXTS: Record<ValeurKey, (firstName: string) => string> = {
  liberte: (n) => `${n}, ton profil révèle une personne créative, indépendante et en quête d'expression. Tu avances avec un besoin fort de liberté et d'autonomie, tout en veillant à préserver ton équilibre et tes valeurs. Tu cherches à construire une vie qui te ressemble, avec authenticité et sens.`,
  famille: (n) => `${n}, ton profil révèle une personne profondément attachée à ses proches, bienveillante et tournée vers l'harmonie. La famille est ton ancrage et ta source d'énergie première. Tu construis ta vie autour de liens solides, sincères et durables.`,
  sante: (n) => `${n}, ton profil révèle une personne attentive à son bien-être, équilibrée et consciente de l'importance de prendre soin de soi. Tu places ta santé physique et mentale au cœur de tes choix, avec sagesse et cohérence.`,
  succes: (n) => `${n}, ton profil révèle une personne ambitieuse, déterminée et orientée vers la réussite. Tu avances avec un fort désir d'accomplissement et de dépassement de soi. Tes objectifs te motivent profondément et tu mets tout en œuvre pour les atteindre.`,
  amour: (n) => `${n}, ton profil révèle une personne profondément connectée aux autres, empathique et en quête de relations authentiques. L'amour et la connexion humaine sont au cœur de ta vie. Tu construis des liens sincères et durables avec ceux qui t'entourent.`,
  connaissance: (n) => `${n}, ton profil révèle une personne curieuse, intellectuellement passionnée et en quête constante d'apprentissage. Tu nourris ton esprit avec enthousiasme et tu vois dans la connaissance un levier essentiel de ta croissance personnelle.`,
  contribution: (n) => `${n}, ton profil révèle une personne généreuse, engagée et animée par le désir de faire une différence. Tu trouves ton sens dans le service aux autres et dans l'impact positif que tu peux avoir sur ton entourage et la société.`,
  creativite: (n) => `${n}, ton profil révèle une personne créative, originale et en quête d'expression. Tu t'épanouis dans la création, l'innovation et l'exploration de nouvelles idées. Ta créativité est ta force et ton mode d'expression privilégié.`,
  spiritualite: (n) => `${n}, ton profil révèle une personne ancrée dans ses croyances, en quête de sens profond et de connexion spirituelle. Tu accordes une grande importance à la dimension intérieure de ta vie et à vivre en accord avec tes valeurs les plus profondes.`,
  independance_financiere: (n) => `${n}, ton profil révèle une personne prévoyante, ambitieuse et désireuse de construire une sécurité durable. L'indépendance financière est pour toi un vecteur de liberté et d'épanouissement. Tu travailles avec détermination vers tes objectifs.`,
  reconnaissance: (n) => `${n}, ton profil révèle une personne investie, sensible au regard des autres et animée par le désir d'être valorisée. Tu donnes le meilleur de toi-même et tu aspires à voir ton engagement reconnu à sa juste valeur.`,
  equilibre: (n) => `${n}, ton profil révèle une personne sage, en quête d'harmonie et attentive à la qualité de vie. Tu places l'équilibre au cœur de tes décisions, en veillant à préserver ton bien-être dans toutes les sphères de ta vie.`,
  respect: (n) => `${n}, ton profil révèle une personne intègre, digne et attachée aux valeurs humaines fondamentales. Le respect est le pilier de tes relations et de ta façon d'être au monde. Tu inspires confiance et estime par ton authenticité.`,
  aventure: (n) => `${n}, ton profil révèle une personne audacieuse, ouverte et en quête de nouvelles expériences. Tu t'épanouis dans le changement, la découverte et le dépassement de tes limites. La vie pour toi est une aventure à vivre pleinement.`,
  securite: (n) => `${n}, ton profil révèle une personne posée, prévoyante et en quête de stabilité. La sécurité est pour toi un fondement essentiel qui te permet de te construire et de t'épanouir. Tu avances avec prudence et sagesse vers un cadre de vie solide.`,
}

export function getProfileText(firstName: string, topValeurs: Valeur[]): string {
  const key = topValeurs[0]?.key as ValeurKey
  const fn = PROFILE_TEXTS[key]
  return fn ? fn(firstName) : `${firstName}, ton profil révèle une personnalité riche et équilibrée. Tes valeurs fondamentales guident tes choix avec cohérence et authenticité. Tu avances avec clarté vers une vie qui a du sens pour toi.`
}

const ValeursReportTemplate = forwardRef<HTMLDivElement, {
  firstName: string
  lastName: string
  scores: Record<string, number>
}>(({ firstName, lastName, scores }, ref) => {
  const sorted = [...VALEURS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
  const top5 = sorted.slice(0, 5)
  const profileText = getProfileText(firstName, top5)

  return (
    <div ref={ref}>
      <div style={{
        width: PAGE_W,
        height: PAGE_H,
        background: 'white',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{ position: 'absolute', top: 22, left: 26 }}>
          <img src="/logo.png" style={{ height: 58, objectFit: 'contain', display: 'block' }} alt="Success Compass" />
        </div>

        {/* Title block */}
        <div style={{ paddingTop: 108, paddingLeft: 46, paddingRight: 160 }}>
          <div style={{ fontSize: 40, color: '#c5d5e0', fontWeight: 300, letterSpacing: 3, lineHeight: 1, marginBottom: 4 }}>
            Analyse
          </div>
          <div style={{ fontSize: 54, color: '#1D3462', fontWeight: 900, letterSpacing: 2, lineHeight: 1.1 }}>
            DES VALEURS
          </div>
        </div>

        {/* Subtitle */}
        <div style={{
          margin: '28px 46px 26px',
          borderLeft: '5px solid #1D3462',
          paddingLeft: 14,
        }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1D3462' }}>
            Voici vos cinq valeurs Fondamentales :
          </span>
        </div>

        {/* Top 5 values */}
        <div style={{ paddingLeft: 46, paddingRight: 46 }}>
          {top5.map((v) => (
            <div key={v.key}>
              <div style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 22,
                color: '#1D3462',
                paddingTop: 13,
                paddingBottom: 13,
                letterSpacing: 0.5,
              }}>
                {v.label}
              </div>
              <div style={{ height: 2, background: '#1D3462', borderRadius: 1 }} />
            </div>
          ))}
        </div>

        {/* Profile text */}
        <div style={{
          margin: '26px 56px 0',
          textAlign: 'center',
          fontSize: 14,
          color: '#333333',
          lineHeight: 1.75,
        }}>
          {profileText}
        </div>
      </div>
    </div>
  )
})

ValeursReportTemplate.displayName = 'ValeursReportTemplate'
export default ValeursReportTemplate
