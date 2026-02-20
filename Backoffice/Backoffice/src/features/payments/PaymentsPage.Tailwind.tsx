import React from 'react';
import TWContainer from '../../components/tailwind/TWContainer';
import GlassCard from '../../components/tailwind/GlassCard';

const PaymentsPageTailwind: React.FC = () => {
  return (
    <TWContainer>
      <GlassCard>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="text-sm text-neutral-600">Tailwind wrapper for existing payments UI.</p>
      </GlassCard>
    </TWContainer>
  );
};

export default PaymentsPageTailwind;
