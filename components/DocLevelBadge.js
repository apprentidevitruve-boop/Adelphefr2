import { Lock } from 'lucide-react';
import DegreeLadder from './DegreeLadder';
import Badge from './Badge';

// Comme DegreeLadder, mais gère aussi "Tous les membres" et "Admin"
// (bureau uniquement), qui ne sont pas des degrés maçonniques et ne
// peuvent donc pas se représenter sur l'échelle des trois degrés.
export default function DocLevelBadge({ level }) {
  if (level === 'admin') return <Badge tone="brass"><Lock size={10} /> Admin</Badge>;
  if (level === 'all') return <Badge tone="neutral">Tous les membres</Badge>;
  return <DegreeLadder degree={level} size="sm" />;
}
