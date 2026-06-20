import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import OnboardingStep from "../../../components/OnboardingStep";
import ContinueButton from "../../../components/ContinueButton";
import { vendorData } from "../../../stores/OnboardingStore";

const categories = [
  "Food & Drinks",
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Agriculture",
  "Other",
];

export default function VendorStep1() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const canContinue =
    businessName.trim().length > 0 && selectedCategory.length > 0;

  const handleContinue = () => {
    vendorData.businessName = businessName.trim();
    vendorData.category = selectedCategory;
    router.push("/onboarding/vendor/step2" as any);
  };

  return (
    <OnboardingStep
      title="Tell us about your shop."
      subtitle="This is how buyers will find you."
      step={1}
      totalSteps={3}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-6">
          <Text className="text-sm font-semibold font-sans text-gray-700 mb-5">
            Business name
          </Text>
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Mama Titi's Kitchen"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            className="border border-gray-200 mt-5 font-sans rounded-xl px-4 py-3.5 text-gray-900 text-base bg-black"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-4 mb-3">
            Category
          </Text>
          <View
            className="flex-row flex-wrap gap-2 mt-4"
            style={{
              width: 320,
              display: "flex",
              flexWrap: "wrap"
            }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className="px-4 py-2 font-sans rounded-full border"
                style={{
                  backgroundColor:
                    selectedCategory === cat ? "#EB0031" : "#F9FAFB",
                  borderColor: selectedCategory === cat ? "#EB0031" : "#E5E7EB",
                  paddingVertical: 4,
                  paddingHorizontal: 9,
                  marginTop: 10,
                }}
              >
                <Text
                  className="text-sm font-sans font-medium"
                  style={{
                    color: selectedCategory === cat ? "#fff" : "#374151",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} />
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#00000005",
    borderRadius: 10,
    padding: 15,
    borderColor: "#00000010",
    marginTop: 10,
  },
  category: {},
});
