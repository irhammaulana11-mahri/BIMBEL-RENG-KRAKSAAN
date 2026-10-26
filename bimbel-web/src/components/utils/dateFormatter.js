export function formatDate(date){
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

}