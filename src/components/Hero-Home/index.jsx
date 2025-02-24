import React from "react";
import './Hero-home.css';

const HeroHome = () => {
  return (

      <div
        className="custom-hero-section container-fluid  d-sm-flex align-items-center justify-content-between">
          <div className="row ">
       <div className="custom-hero-headline col-lg-5 col-12 d-flex flex-column align-items-lg-start justify-content-lg-start justify-content-center align-items-center ">

          <div className="custom-hero-content ">
            <span className="custom-hero-subheadline">
              Save Lives, Donate Organs
            </span>
            <h1 className="custom-hero-title">
              Become a Hero<span className="highlight"> and <br /> Save a Life</span>
            </h1>
          </div>
          <p>
            Orglink is an innovative organ donation system designed to connect
            donors and recipients seamlessly. It aims to save lives by ensuring a
            transparent, efficient, and secure platform for organ matching and
            transplantation. Join us in making a difference today.
          </p>
          <p>Join As a</p>
          <div className="btn-join-parent">
          <a
            href="#"
            className="custom-hero-button w-50 mt-2  mx-0 text-center py-2 rounded-pill"
          >
             Donner

          </a>
          <a
            href="#"
            className="custom-hero-button w-50 mt-2  mx-0 text-center py-2 rounded-pill"
          >
          Hospital
          </a>
          <a
            href="#"
            className="custom-hero-button w-50 mt-2 mx-0 text-center py-2 rounded-pill"
          >
           Receipient

          </a>
          </div>
        </div>
        <div className="custom-hero-image col-lg-7 col-12  clipped">
          {/* Video Play Button */}
          {/* <a id="play-video" class="video-play-button" href="#">
            <span></span>
          </a> */}
          {/* Video Overlay (Hidden by default) */}
          <div id="video-overlay" className="video-overlay">
            {/* <a className="video-overlay-close">×</a> */}
          </div>
        </div>
      </div>
      </div>
  );
};

export default HeroHome;
