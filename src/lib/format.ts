// Formata datas sempre no fuso de São Paulo, para o build (UTC) e o navegador concordarem.
export function formatDate(date: string): string {
  if (!date) return ''
  // Datas só com dia ("2025-06-02") são tratadas como meio-dia para não "voltarem" um dia.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00-03:00` : date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

export function isoDate(date: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00-03:00` : date)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}
