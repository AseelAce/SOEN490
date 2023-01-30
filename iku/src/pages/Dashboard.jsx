import React, { useEffect , useState, useRef } from "react";
import BaseLayout from "../components/BaseLayout";
import DashboardCard from "../components/DashboardCard";
import EditLocation from "../components/EditLocation";
import axios from "axios";
import { Link } from "react-router-dom";
import { ReactComponent as DurationIcon } from "./../assets/clock-regular.svg";
import { ReactComponent as FrequencyIcon } from "./../assets/table-solid.svg";
import { ReactComponent as WalkIcon } from "./../assets/person-walking-solid.svg";
import {loadScores} from "../backend/utils/scoring";
import CompareIcon from "../assets/compare.png"
import ScoreCompareModal from "../components/ScoreCompareModal";

export default function Dashboard() {

  const user_id = localStorage.getItem("user_id");
  const [locations, getLocations] = useState([]);
  const [rawOrigins, setRawOrigins] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [rawCurrentHome, setRawCurrentHome] = useState([]);
  const [currentHome, setCurrentHome] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [cards, setCards] = useState([])
  const [cardToCompare, setCardToCompare] = useState([]);
  const [compare, setCompare] = useState(false)
  const [compareModal, setCompareModal] = useState(false)

  const addCardToCompare = (count) => {
    cardToCompare.push(count)
    if (cardToCompare.length === 2) setCompareModal(true)
  }

  const closeCompareModal = () => {
    setCompareModal(false)
    setCardToCompare([])
  }

  const locationsLoaded = useRef(false);
  const locationsSplit = useRef(false);

  let originCards;
  let destinationCards;

  // Fetch all locations from the DB
  const fetchLocations = () => {
    const user_id = localStorage.getItem("user_id");

    if(user_id == null) {
      let locationStringArray = sessionStorage.getItem('location')
      if(locationStringArray != null) {
        let locationArray = JSON.parse(locationStringArray);
        getLocations(locationArray);
      }
    } else {
      axios.get(`http://localhost:5000/locations/${user_id}`)
          .then((response) => {
            getLocations(response.data);
          })
          .catch(err => console.error(err));
    }
    locationsLoaded.current = true;
  }

  // Split the fetched locations into three: the current home, the other origins, and the destinations
  const splitLocations = () => {
    if (locations.length > 0) {
      setRawCurrentHome(locations.find(loc => loc.current_home));
      setRawOrigins(locations.filter(loc => !loc.current_home && loc.origin));
      setDestinations(locations.filter(loc => !loc.origin));
    }
    locationsSplit.current = true;
  }

  // Fetch the scores for all origins except the current home
  const fetchScores = async () => {

    // Get the weighted average scores
    async function getScores(origin) {
      return await loadScores(origin, null, user_id);
    }

    // Get the individual scores related to each destination
    function getDetailedScores(origin) {
      let detailedScores = [];

      for (const d of destinations) {
        loadScores(origin, d, user_id).then((r) => {detailedScores.push(r)});
      }

      return detailedScores;
    }

    // Map all scores and set `origins` to it
    const originsWithScores = await Promise.all(rawOrigins.map(async o => ({
      ...o, scores: await getScores(o), detailedScores: getDetailedScores(o)
    })));

    setOrigins(originsWithScores);
  }

  // Fetch the scores for the current home
  const fetchCurrentHomeScores = async () => {
    const scores = await loadScores(rawCurrentHome, null, user_id)
      .catch(e => console.log(e));
    let detailedScores = [];

    for (const d of destinations) {
      const scoreSet = await loadScores(rawCurrentHome, d, user_id)
        .catch(e => console.log(e));
      detailedScores.push(scoreSet);
    }

    setCurrentHome({
      ...rawCurrentHome, scores: scores, detailedScores: detailedScores
    });
  }

  // Fetch the locations from the DB
  useEffect(() => {
    fetchLocations();
  }, []);

  // Split the fetched locations
  useEffect(() => {
    if (locationsLoaded.current) {
      splitLocations();
    }
  }, [locations]);

  // Fetch the origins' scores from the DB
  useEffect(() => {
    if (locationsSplit.current) {
      fetchScores();
      fetchCurrentHomeScores();
    }
  }, [rawOrigins, destinations]);

  // Create card with the list of destinations
  if (destinations.length > 0) {
    destinationCards = destinations.map(function(loc){
      return (
        <div className="bg-white text-emerald-500 rounded-2xl px-4 py-2 flex justify-between items-center" key={loc}>
          <span className="font-semibold text-xl text-left line-clamp-2">
            {loc.name}
          </span>
          <div className="flex flex-nowrap gap-2">
            <Link to="/" className="transition ease-in-out duration-200 rounded-lg">
              <button type="button" className="w-8 h-8 flex items-center justify-center transition ease-in-out font-semibold rounded-lg text-md bg-emerald-200 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-400 text-emerald-600 dark:text-emerald-800 hover:bg-emerald-600 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Link>
            <EditLocation loc={loc} buttonClass="w-8 h-8 flex items-center justify-center transition ease-in-out font-semibold rounded-lg text-md bg-emerald-200 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-400 text-emerald-600 dark:text-emerald-800 hover:bg-white"/>
          </div>
        </div>
      );
    })
  } else {
    destinationCards =
    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 flex flex-col items-center gap-2">
      <div className="flex justify-between items-center gap-2 drop-shadow-lg">
        <span className="font-bold text-2xl text-center text-white">
          No saved destinations yet.
        </span>
      </div>
    </div>;
  }

  // Create origins' scorecards
  let count = -1
  let currentHomeObj = null
  if (origins.length > 0) {
    originCards = origins.map(function(loc) {
      count += 1
      cards[count] = <DashboardCard loc={loc} destinations={destinations} key={count} count={count} compare={compare} addCardToCompare={addCardToCompare}>{loc.name}</DashboardCard>;
      return cards[count]
    })
    if (currentHome) {
      count += 1
      currentHomeObj = <DashboardCard loc={currentHome} destinations={destinations} invert compare={compare} key={count} count={count} addCardToCompare={addCardToCompare}>{currentHome.name}</DashboardCard>
      cards[count] = currentHomeObj;
    }
  } else {
    originCards =
    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 flex flex-col items-center gap-2">
      <div className="flex justify-between items-center gap-2 drop-shadow-lg">
        <span className="font-bold text-2xl text-center text-white">
          No saved locations yet.
        </span>
      </div>
    </div>;
  }

  return (
    <>
      <BaseLayout className="flex flex-col" ignore={['dashboard']}>
        {/*<div className="w-full grow flex flex-col items-center p-8 bg-cover bg-center bg-fixed bg-[url('/src/assets/dashboard_bg.jpg')]">*/}
        <div className="w-full grow flex flex-col items-center p-8">
          <div className="w-full flex flex-col justify-center">
            <div className="flex gap-8">
              <div className="w-96 flex flex-col gap-8 items-center">
                <div className="w-full flex flex-col items-center p-4 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 dark:from-[#0e3331] dark:to-[#0c2927] p-4 gap-4">
                  <p className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-emerald-200">
                    Current Home
                  </p>
                  {
                    currentHomeObj && currentHomeObj.props.children ?
                      <>
                        { currentHomeObj }
                      </>
                      :
                      <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 flex flex-col items-center gap-2 w-64">
                        <div className="flex justify-between items-center gap-2 drop-shadow-lg">
                          <span className="font-bold text-2xl text-center text-white">
                            No specified current home.
                          </span>
                        </div>
                      </div>
                  }
                </div>

                <ScoreCompareModal firstLocation={cards[cardToCompare[0]]} secondLocation={cards[cardToCompare[1]]} show={compareModal} onClose={closeCompareModal} ></ScoreCompareModal>
                
                <div className="w-96 h-fit flex flex-col items-center rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 dark:from-[#0e3331] dark:to-[#0c2927] p-4 gap-4">
                  <span className="flex items-center gap-2">
                    <p className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-emerald-200">
                      Priorities List
                    </p>
                  </span>

                  <div className="w-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 flex flex-col gap-2">
                    <div className="bg-white font-semibold text-2xl text-emerald-500 rounded-2xl px-4 py-2 flex gap-2 justify-start items-center">
                      <span>1. Frequency</span>
                      <FrequencyIcon className="fill-emerald-500 w-6 h-6"/>
                    </div>

                    <div className="bg-white font-semibold text-2xl text-emerald-500 rounded-2xl px-4 py-2 flex gap-2 justify-start items-center">
                      <span>2. Duration</span>
                      <DurationIcon className="fill-emerald-500 w-6 h-6"/>
                    </div>

                    <div className="bg-white font-semibold text-2xl text-emerald-500 rounded-2xl px-4 py-2 flex gap-2 justify-start items-center">
                      <span>3. Walk Time</span>
                      <WalkIcon className="fill-emerald-500 w-6 h-6"/>
                    </div>
                  </div>

                  <Link to="/" className="transition ease-in-out duration-200 rounded-lg font-bold text-2xl">
                    <button type="button" className="w-full flex items-center justify-start gap-2 transition ease-in-out font-semibold rounded-2xl text-md bg-emerald-200 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-400 text-emerald-600 dark:text-emerald-800 hover:bg-white px-4 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit Frequencies
                    </button>
                  </Link>
                </div>
                
              </div>
              <div className="grow h-fit flex flex-col rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 dark:from-[#0e3331] dark:to-[#0c2927] p-4 gap-4">
                <div className="flex flex-row space-between justify-between">
                  <div className="w-16"></div>
                  <p className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-emerald-200">
                    Added Homes
                  </p>
                  <img src={CompareIcon} className="w-16 cursor-pointer" onClick={() => setCompare(!compare)} />
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,16rem)] justify-center gap-8 h-fit">
                  {originCards}
                </div>
              </div>
              
              <div className="w-96 h-fit flex flex-col items-center rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 dark:from-[#0e3331] dark:to-[#0c2927] p-4 gap-4">
                <p className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-emerald-200">
                  Added Destinations
                </p>
                <div className="w-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 flex flex-col gap-2">
                  {destinationCards}
                </div>

                <Link to="/" className="transition ease-in-out duration-200 rounded-lg font-bold text-2xl">
                  <button type="button" className="w-full flex items-center justify-start gap-2 transition ease-in-out font-semibold rounded-2xl text-md bg-emerald-200 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-400 text-emerald-600 dark:text-emerald-800 hover:bg-white px-4 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add Destination
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}
