import { Image, type ImageSource } from 'expo-image';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  bottomImage?: ImageSource;
  bottomImageHeight?: number;
}

/** Auth screens — keyboard-safe scroll + decorative bottom image that does not block taps. */
export default function AuthScreenLayout({
  children,
  bottomImage,
  bottomImageHeight = 320,
}: AuthScreenLayoutProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        className="flex-1 bg-light-primary dark:bg-dark-primary"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}>
          <View
            className="flex-1 p-6"
            style={{ paddingBottom: bottomImage ? bottomImageHeight / 2 : 24 }}>
            {children}
          </View>
        </ScrollView>
        {bottomImage ? (
          <Image
            source={bottomImage}
            style={{ width: '100%', height: bottomImageHeight, position: 'absolute', bottom: 0 }}
            contentFit="contain"
            pointerEvents="none"
          />
        ) : null}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
