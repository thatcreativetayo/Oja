import React, { useState } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import OnboardingStep from "../../../components/OnboardingStep";
import ContinueButton from "../../../components/ContinueButton";
import { vendorData } from "../../../stores/OnboardingStore";

export default function VendorStep2() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  const canContinue = ownerName.trim().length > 0 && phone.trim().length >= 10;

  const handleContinue = () => {
    vendorData.ownerName = ownerName.trim();
    vendorData.phone = phone.trim();
    router.push("/onboarding/vendor/step3" as any);
  };

  return (
    <OnboardingStep
      title="About You"
      subtitle="Your personal contact details"
      step={2}
      totalSteps={3}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Full name
          </Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g. Fatima Abdullahi"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: "#00000005",
              borderRadius: 10,
              padding: 15,
              borderColor: "#00000010",
              marginTop: 10,
            }}
            className="border font-sans border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-sans font-medium text-gray-700 mb-2">
            Phone number
          </Text>
          <View className="flex-row font-sans items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden"
          style={{
              backgroundColor: "#00000005",
              borderRadius: 10,
              paddingHorizontal: 15,
              borderColor: "#00000010",
              marginTop: 10,
            }}
          >
            <View className="px-4 py-3.5 border-r border-gray-200">
              <Text className="text-gray-600 font-sans font-medium">🇳🇬 +234</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="0812 345 6789"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="flex-1 px-4 font-sans py-3.5 text-gray-900 text-base"
            />
          </View>
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} />
    </OnboardingStep>
  );
}
