import React from "react";
import "bulma/css/bulma.css";
import Logo from "./../assets/iku_logo_white.png";
import styles from "./../styles/cssHomepage.module.css";

export default function HomeHeader() {
  return (
    <div>
      <div>
        <section class="hero">
          <div class={styles.header}>
            <div class="hero-body">
              <nav class="navbar">
                <div class="container">
                  <div class="navbar-brand">
                    <img
                      src={Logo}
                      width="200"
                      height="300"
                      alt="ikulogo"
                    ></img>
                  </div>
                  <div id="navbarMenu" class="navbar-menu is-active">
                    <div class="navbar-end">
                      <div>
                        <a href="/register">
                          <p class="has-text-white has-text-weight-bold is-size-4 mt-6 mr-6">
                            Sign Up
                          </p>
                        </a>
                      </div>
                      <div>
                        <a href="/login">
                          <p class="has-text-white has-text-weight-bold is-size-4 mt-6">
                            Login
                          </p>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
