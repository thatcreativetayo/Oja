import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingStep from '../../../components/OnboardingStep';
import ContinueButton from '../../../components/ContinueButton';
import { buyerData } from '../../../stores/OnboardingStore';

export default function BuyerStep1() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const canContinue = fullName.trim().length > 2 && phone.trim().length >= 10;

  const handleContinue = () => {
    buyerData.fullName = fullName.trim();
    buyerData.phone = phone.trim();
    router.push('/onboarding/buyer/step2' as any);
  };

  return (
    <OnboardingStep
      title="Create Account"
      subtitle="Just a few details to get you started"
      step={1}
      totalSteps={2}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Amaka Obi"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Phone number</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            <View className="px-4 py-3.5 border-r border-gray-200">
              <Text className="text-gray-600 font-medium">🇳🇬 +234</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="0812 345 6789"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="flex-1 px-4 py-3.5 text-gray-900 text-base"
            />
          </View>
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} />
    </OnboardingStep>
  );
}