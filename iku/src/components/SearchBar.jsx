import { React, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";
import { ReactComponent as Location } from "./../assets/location.svg";

export default function SearchBar() {
  // To autofill the textbox after fetching current location
  const inputRef = useRef(null);

  // Handles input in the search bar
  const [input, setInput] = useState("");

  // Handles places suggestions returned by api
  const [suggestions, setSuggestions] = useState([]);

  const navigate = useNavigate();

  const selectSuggestion = (suggestion) => {
    inputRef.current.value = suggestion;
    setInput(suggestion);
    setSuggestions([]);
  };

  const handleEnterPressed = async (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await axios
      .get("http://localhost:5000/coordinates", {
        params: {
          address: input,
        },
      })
      .then(async (response) => {
        const userId = localStorage.getItem("user_id");
        const location = {
          latitude: response.data.coordinates.lat,
          longitude: response.data.coordinates.lng,
          name: input.split(",")[0],
          notes: input,
          origin: true,
          current_home: false,
        };

        let locationStringArray;
        if(userId == null) {
          locationStringArray = sessionStorage.getItem("location")

          if(locationStringArray == null) {
            sessionStorage.setItem('location', JSON.stringify([location]));
          } else {
            let locationsArray = JSON.parse(locationStringArray);
            locationsArray.push(location);
            sessionStorage.setItem('location', JSON.stringify(locationsArray));
          }
        } else {
          await axios
            .post("http://localhost:5000/newlocation", {
              user_id: mongoose.Types.ObjectId(userId),
              ...location
            })
          .catch((error) => {
            console.log(error.message);
          });
        }
        navigate("/dashboard");
      })
      .catch((error) => {
        console.log(error.message);
      });
  };

  const getSuggestions = async (event) => {
    setInput(event.target.value);
    if (event.target.value.length > 0) {
      await axios
        .get("http://localhost:5000/suggestions", {
          params: {
            input: event.target.value,
          },
        })
        .then((response) => {
          setSuggestions(response.data.predictions);
        })
        .catch((error) => {
          console.log(error.message);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("ERROR: Goeolocation is not supported by your browser");
    } else {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          await axios
            .get("http://localhost:5000/address", {
              params: {
                lat: latitude,
                lng: longitude,
              },
            })
            .then(function (response) {
              inputRef.current.value = response.data.address;
            });
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    }
  };

  return (
    <>
      <div className="shadow-lg shadow-gray-400 dark:shadow-gray-900 rounded-3xl w-full bg-cover bg-center bg-[url('/src/assets/stm_bus.jpg')]">
        <div className="rounded-3xl p-2 xs:p-8 sm:p-16 w-full backdrop-blur backdrop-brightness-50 flex flex-col items-center justify-center">
          <div className="text-emerald-400 dark:text-emerald-400 flex flex-col gap-4 p-4">
            <p className="text-center text-5xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-500">
              Let's find your transit scores
            </p>
            <div className="flex items-center justify-center gap-4">
              <form className="rounded-lg drop-shadow-lg grow">
                <label
                  htmlFor="default-search"
                  className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300"
                >
                  Search
                </label>
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    onChange={getSuggestions}
                    onKeyDown={handleEnterPressed}
                    type="search"
                    id="default-search"
                    className="accent-emerald-700 dark:accent-white transition ease-in-out duration-200 block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border-2 border-emerald-500 focus:border-emerald-700 dark:bg-gray-700 dark:border-emerald-400 dark:placeholder-gray-400 dark:text-white dark:focus:border-white"
                    placeholder="Search Location"
                    list="suggestions"
                    autoComplete="off"
                    required
                  />
                  <datalist id="suggestions">
                    {suggestions.map((suggestion) => {
                      return (
                        <option
                          className="cursor-pointer"
                          onClick={() => selectSuggestion(suggestion)}
                          value={suggestion}
                        />
                      );
                    })}
                  </datalist>
                  <button
                    onClick={handleSubmit}
                    className="transition ease-in-out duration-200 text-white absolute right-2.5 bottom-2.5 bg-emerald-500 hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-semibold rounded-lg text-sm px-4 py-2 dark:bg-emerald-400 dark:hover:bg-emerald-600 dark:focus:ring-green-300"
                  >
                    Search
                  </button>
                </div>
              </form>
              <span className="h-14 flex items-center">
                <p>or</p>
              </span>
              {/* w-14 and h-14 is the size of the adjacent searchbox */}
              <button
                type="button"
                className="w-14 h-14 flex items-center justify-center transition ease-in-out duration-200 text-white bg-emerald-500 hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-semibold rounded-lg p-3 dark:bg-emerald-400 dark:hover:bg-emerald-600 dark:focus:ring-green-300"
              >
                <Location onClick={getCurrentLocation} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
