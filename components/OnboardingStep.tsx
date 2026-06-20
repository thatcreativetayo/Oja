import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  children: React.ReactNode;
  onBack?: () => void;
  scrollable?: boolean;
}

export default function OnboardingStep({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  onBack,
  scrollable = false,
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View className="px-6 pt-14">
        <TouchableOpacity onPress={handleBack} className="mb-6 w-10 h-10 items-center p-1 justify-center">
          <Text style={{ fontSize: 22, color: '#1a1a1a', backgroundColor: "#fff", borderColor: "#000" }}>←</Text>
        </TouchableOpacity>

        {/* Progress bar */}
        <View className="flex-row gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i < step ? '#EB0031' : '#E5E7EB' }}
            />
          ))}
        </View>

        <Text className="text-2xl font-heading text-gray-900">{title}</Text>
        <Text className="text-gray-500 font-sans text-sm">{subtitle}</Text>
      </View>

      <View className="flex-1 px-6 pt-8">
        {children}
      </View>
    </SafeAreaView>
  );
}