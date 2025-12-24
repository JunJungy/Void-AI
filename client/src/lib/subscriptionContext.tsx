import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export type PlanType = "free" | "ruby" | "pro" | "diamond";

interface SubscriptionContextType {
  currentPlan: PlanType;
  setPlan: (plan: PlanType) => void;
  canAccessModel: (modelPlan: string) => boolean;
  getRequiredPlan: (modelPlan: string) => PlanType | null;
  canAccessModelWithPlan: (modelPlan: string, userPlan: PlanType) => boolean;
  getRequiredPlanForUser: (modelPlan: string, userPlan: PlanType) => PlanType | null;
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

  const checkPlanAccess = useCallback((modelPlan: string, plan: PlanType): boolean => {
    if (plan === "diamond") return true;
    if (modelPlan === "free") return true;
    if (plan === "pro" && (modelPlan === "pro" || modelPlan === "ruby")) return true;
    if (plan === "ruby" && modelPlan === "ruby") return true;
    return false;
  }, []);

  const canAccessModel = useCallback((modelPlan: string): boolean => {
    return checkPlanAccess(modelPlan, currentPlan);
  }, [currentPlan, checkPlanAccess]);

  const canAccessModelWithPlan = useCallback((modelPlan: string, userPlan: PlanType): boolean => {
    return checkPlanAccess(modelPlan, userPlan);
  }, [checkPlanAccess]);

  const getRequiredPlan = useCallback((modelPlan: string): PlanType | null => {
    if (canAccessModel(modelPlan)) return null;
    if (modelPlan === "ruby") return "ruby";
    if (modelPlan === "pro") return "pro";
    return null;
  }, [canAccessModel]);

  const getRequiredPlanForUser = useCallback((modelPlan: string, userPlan: PlanType): PlanType | null => {
    if (canAccessModelWithPlan(modelPlan, userPlan)) return null;
    if (modelPlan === "ruby") return "ruby";
    if (modelPlan === "pro") return "pro";
    return null;
  }, [canAccessModelWithPlan]);

  const setPlan = (plan: PlanType) => {
    setCurrentPlan(plan);
  };

  return (
    <SubscriptionContext.Provider value={{
      currentPlan,
      setPlan,
      canAccessModel,
      getRequiredPlan,
      canAccessModelWithPlan,
      getRequiredPlanForUser,
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
