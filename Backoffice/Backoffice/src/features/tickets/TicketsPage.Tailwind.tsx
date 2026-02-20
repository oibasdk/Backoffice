import React from 'react';
import TWContainer from '../../components/tailwind/TWContainer';
import GlassCard from '../../components/tailwind/GlassCard';

const TicketsPageTailwind: React.FC = () => {
  return (
    <TWContainer>
      <GlassCard>
        <h2 className="text-lg font-semibold">Tickets</h2>
        <p className="text-sm text-neutral-600">Tailwind wrapper for tickets UI.</p>
      </GlassCard>
    </TWContainer>
  );
};

export default TicketsPageTailwind;
