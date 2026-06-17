import HeroSection from "../../components/public/HeroSection";
import FeatureSection from "../../components/public/FeatureSection";
import PackageSection from "../../components/public/PackageSection";
import ActivitySection from "../../components/public/ActivitySection";
import ArticleSection from "../../components/public/ArticleSection";
import TestimonialSection from "../../components/public/TestimonialSection";
import BannerSection from "../../components/public/BannerSection";
import FaqSection from "../../components/public/FaqSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
        <BannerSection />
          <PackageSection />
            <ActivitySection />
          <ArticleSection />
        <TestimonialSection />
      <FaqSection />
    </>
  );
}