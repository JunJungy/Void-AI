import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type PlanType = "free" | "ruby" | "pro" | "diamond";

interface SubscriptionContextType {
  currentPlan: PlanType;
  setPlan: (plan: PlanType) => void;
  canAccessModel: (modelPlan: string) => boolean;
  getRequiredPlan: (modelPlan: string) => PlanType | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('userPlan') as PlanType) || 'free';
    }
    return 'free';
  });

  useEffect(() => {
    localStorage.setItem('userPlan', currentPlan);
  }, [currentPlan]);

  const canAccessModel = (modelPlan: string): boolean => {
    if (currentPlan === "diamond") return true;
    if (modelPlan === "free") return true;
    if (currentPlan === "ruby" && modelPlan === "ruby") return true;
    if (currentPlan === "pro" && modelPlan === "pro") return true;
    return false;
  };

  const getRequiredPlan = (modelPlan: string): PlanType | null => {
    if (canAccessModel(modelPlan)) return null;
    if (modelPlan === "ruby") return "ruby";
    if (modelPlan === "pro") return "pro";
    return null;
  };

  const setPlan = (plan: PlanType) => {
    setCurrentPlan(plan);
  };

  return (
    <SubscriptionContext.Provider value={{
      currentPlan,
      setPlan,
      canAccessModel,
      getRequiredPlan,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
