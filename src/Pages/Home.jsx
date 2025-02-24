import { Link } from "react-router-dom";
 import React from "react";
 import '../'
import HeroHome from "../components/Hero-Home";
import '../../src/App.css'
import DonationSystem from "../components/Donation-System";
import WorkStation from "../components/work-station";
import Statistic from "../components/Statistics";
import SuccessStories from "../components/Success-Stories";
import TestimonialSection from "../components/Testimonials";
import PartnerSection from "../components/partner";
import Footer from "../components/Footer";
const Home = () => {
  return (
    <>
     <HeroHome />
     <DonationSystem />
     <WorkStation />
     <  Statistic />
     <SuccessStories />
     <TestimonialSection />
     <PartnerSection />
     <Footer />
    </>
  );
};

export default Home;
