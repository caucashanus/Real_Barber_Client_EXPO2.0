import React, {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  Children,
  isValidElement,
  useMemo,
} from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Header from '@/components/Header';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';

// Step component that will be used as children
export interface StepProps {
  title: string;
  optional?: boolean;
  /**
   * U volitelného kroku: `false` = v hlavičce se neukáže „Přeskočit“ (např. vlastní tlačítko v obsahu).
   * Výchozí: u optional kroků se skip v hlavičce zobrazuje.
   */
  optionalSkipInHeader?: boolean;
  /** Skryje šipku zpět (např. závěrečná obrazovka jen s Dokončit). */
  hideHeaderBack?: boolean;
  /** Skryje křížek zavření vpravo nahoře. */
  hideHeaderClose?: boolean;
  children: ReactNode;
}

export const Step: React.FC<StepProps> = ({ children }) => {
  return <>{children}</>; // Just render children, this is mainly for type safety
};

// Add this to help with type checking
const isStepComponent = (child: any): child is React.ReactElement<StepProps> => {
  return isValidElement(child) && (child.type === Step || (typeof child.type === 'function' && child.type.name === 'Step'));
};

interface StepData {
  key: string;
  title: string;
  optional?: boolean;
  optionalSkipInHeader?: boolean;
  hideHeaderBack?: boolean;
  hideHeaderClose?: boolean;
  component: ReactNode;
}

export type StepNavigationReason = 'next' | 'back' | 'skip';

interface MultiStepProps {
  children: ReactNode;
  onComplete: () => void;
  onClose?: () => void;
  showHeader?: boolean;
  showStepIndicator?: boolean;
  className?: string;
  onStepChange?: (nextStep: number) => boolean;
  /** Called whenever the visible step index changes (Next, Back, Skip). */
  onStepIndexChange?: (stepIndex: number, reason: StepNavigationReason) => void;
  isNextDisabled?: (currentStep: number) => boolean;
  /** Loading state for the bottom primary button (e.g. async submit on last step). */
  footerLoading?: boolean;
  /** Počáteční krok (např. deep link přeskočí výběr pobočky / holiče). */
  initialStepIndex?: number;
  /** Nelineární „Další“ (např. z kroku 0 rovnou na 2). */
  getNextStepIndex?: (currentStepIndex: number, stepsLength: number) => number;
  /** Nelineární „Zpět“; vraťte -1 pro zavření wizardu (`onClose`). */
  getPrevStepIndex?: (currentStepIndex: number) => number;
  /**
   * Před přechodem „Další“ z ne-posledního kroku (např. registrace po vyplnění e-mailu).
   * Vraťte false pro zrušení přechodu (zobrazte chybu v kroku).
   */
  onBeforeNext?: (currentStepIndex: number) => Promise<boolean>;
}

export type MultiStepHandle = {
  /** Stejné jako „Přeskočit“ u volitelného kroku (např. z obsahu kroku). */
  skipOptionalStep: () => void;
};

const MultiStep = forwardRef<MultiStepHandle, MultiStepProps>(function MultiStep(
  {
    children,
    onComplete,
    onClose,
    showHeader = true,
    showStepIndicator = true,
    className = '',
    onStepChange,
    onStepIndexChange,
    isNextDisabled,
    footerLoading = false,
    initialStepIndex = 0,
    getNextStepIndex,
    getPrevStepIndex,
    onBeforeNext,
  },
  ref
) {
  // Filter and validate children to only include Step components
  const validChildren = Children.toArray(children)
    .filter(isStepComponent);
  
  // Extract step data from children
  const steps: StepData[] = validChildren.map((child, index) => {
    const {
      title,
      optional,
      optionalSkipInHeader,
      hideHeaderBack,
      hideHeaderClose,
      children: stepContent,
    } = (child as React.ReactElement<StepProps>).props;
    return {
      key: `step-${index}`,
      title: title || `Step ${index + 1}`,
      optional,
      optionalSkipInHeader,
      hideHeaderBack,
      hideHeaderClose,
      component: stepContent,
    };
  });

  // Ensure we have at least one step
  if (steps.length === 0) {
    steps.push({
      key: 'empty-step',
      title: 'Empty',
      component: <View><ThemedText>No steps provided</ThemedText></View>
    });
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const colors = useThemeColors();
  const safeStepIndex = Math.min(Math.max(0, currentStepIndex), Math.max(0, steps.length - 1));
  const currentStep = steps[safeStepIndex]!;
  const isLastStep = safeStepIndex === steps.length - 1;
  const isFirstStep = safeStepIndex === 0;
  const nextDisabled = isNextDisabled ? isNextDisabled(safeStepIndex) : false;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnims = useMemo(
    () => steps.map(() => new Animated.Value(0)),
    [steps.length]
  );

  useEffect(() => {
    if (currentStepIndex >= steps.length && steps.length > 0) {
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStepIndex]);

  useEffect(() => {
    // Reset and start fade/slide animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    // Animate progress indicators
    steps.forEach((_, index) => {
      const anim = progressAnims[index];
      if (!anim) return;
      Animated.timing(anim, {
        toValue: index <= safeStepIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStepIndex, safeStepIndex, steps.length, progressAnims]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const handleNext = async () => {
    if (nextDisabled || footerLoading) return;
    if (isLastStep) {
      onComplete();
      return;
    }
    if (onBeforeNext) {
      const ok = await onBeforeNext(safeStepIndex);
      if (!ok) return;
    }
    const nextStep = getNextStepIndex
      ? getNextStepIndex(currentStepIndex, steps.length)
      : currentStepIndex + 1;
    if (nextStep < 0 || nextStep >= steps.length) return;
    const canProceed = onStepChange ? onStepChange(nextStep) : true;

    if (canProceed) {
      setCurrentStepIndex(nextStep);
      onStepIndexChange?.(nextStep, 'next');
    }
  };

  const stepTransitionHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const handleBack = () => {
    if (getPrevStepIndex) {
      const prevIndex = getPrevStepIndex(currentStepIndex);
      if (prevIndex < 0) {
        onClose?.();
        return;
      }
      if (prevIndex !== currentStepIndex) {
        stepTransitionHaptic();
        setCurrentStepIndex(prevIndex);
        onStepIndexChange?.(prevIndex, 'back');
      }
      return;
    }
    if (!isFirstStep) {
      stepTransitionHaptic();
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepIndexChange?.(prevIndex, 'back');
    }
  };

  const handleSkip = useCallback(() => {
    if (currentStep.optional && !isLastStep) {
      stepTransitionHaptic();
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepIndexChange?.(nextIndex, 'skip');
    }
  }, [currentStep.optional, isLastStep, currentStepIndex, onStepIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      skipOptionalStep: () => {
        handleSkip();
      },
    }),
    [handleSkip]
  );

  const showHeaderSkip =
    currentStep.optional &&
    !isLastStep &&
    currentStep.optionalSkipInHeader !== false;

  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  /** Nad klávesnicí nepotřebujeme plný safe-area inset (jinak vzniká zbytečná mezera). */
  const bottomInset = keyboardVisible ? 4 : insets.bottom;
  const bottomPadClass = keyboardVisible ? 'py-1.5' : 'py-3';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className={`bg-light-primary dark:bg-dark-primary ${className}`}
    >
      <View style={{ flex: 1, paddingBottom: bottomInset }} className="bg-light-primary dark:bg-dark-primary">
      {showHeader && (
        <Header
          rightComponents={[
            onClose && !currentStep.hideHeaderClose ? (
              <Pressable
                key="close"
                onPress={() => onClose()}
                className="p-2 rounded-full active:bg-light-secondary dark:active:bg-dark-secondary"
                hitSlop={8}
              >
                <Icon
                  name="X"
                  size={24}
                  className="text-light-text dark:text-dark-text"
                />
              </Pressable>
            ) : undefined
          ]}
          leftComponent={[
            showHeaderSkip && (
              <Button
                key="skip"
                title={t('multiStepSkip')}
                variant="ghost"
                onPress={handleSkip}
                size="small"
                disableHaptic
              />
            ),
            !isFirstStep && !currentStep.hideHeaderBack && (
              <Icon
                name="ArrowLeft"
                key="back"
                size={24}
                className="text-light-text dark:text-dark-text"
                onPress={handleBack}
              />
            ),
          ]}
        />
      )}

      {/* Step Content */}
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          {currentStep.component}
        </ScrollView>
      </Animated.View>

      {/* Step Indicators – počet segmentů = počet kroků; aktivní krok zvýrazněn (viditelné i v dark módu). */}
      {showStepIndicator && (
        <View className={`px-4 ${bottomPadClass} flex-row justify-center items-center gap-1.5`}>
          {steps.map((_, index) => {
            const isCurrent = index === safeStepIndex;
            const anim = progressAnims[index];
            return (
              <Animated.View
                key={index}
                className="flex-1 rounded-full overflow-hidden max-w-[56px]"
                style={{
                  height: isCurrent ? 8 : 5,
                  backgroundColor: colors.secondary,
                  borderWidth: isCurrent ? 2 : 0,
                  borderColor: colors.highlight,
                  opacity: isCurrent ? 1 : 0.55,
                }}
              >
                <Animated.View
                  style={{
                    height: '100%',
                    backgroundColor: colors.highlight,
                    width:
                      anim?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }) ?? '0%',
                  }}
                />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Bottom Navigation – stejná logika jako tlačítko „Jdeme na to“ (accent pozadí + bílý text) */}
      <View className={`px-4 ${bottomPadClass} border-t border-light-secondary dark:border-dark-secondary`}>
        <Button
          variant="primary"
          size="large"
          rounded="full"
          title={isLastStep ? t('multiStepComplete') : t('multiStepNext')}
          onPress={() => void handleNext()}
          impactFeedbackStyle={Haptics.ImpactFeedbackStyle.Heavy}
          className="w-full"
          textClassName="text-white font-semibold"
          loading={footerLoading}
          style={{
            backgroundColor: nextDisabled || footerLoading ? colors.secondary : colors.highlight,
            opacity: nextDisabled || footerLoading ? 0.9 : 1,
          }}
          disabled={nextDisabled || footerLoading}
        />
      </View>
      </View>
    </KeyboardAvoidingView>
  );
});

export default MultiStep;