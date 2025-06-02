import React, { useState, useEffect } from 'react';  
import Search from "./components/search";
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
import Spinner from "./components/spinner";
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';
// Use api_key as query param for v3 API key
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZDAxNjU2ZDJjYzg2NTJhYTUwMGU1NWIyZDI1YzY1MSIsIm5iZiI6MTc0ODcxMjcxOC41NTMsInN1YiI6IjY4M2IzZDBlMGI4Y2MzNWFjYTdmMzk0OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wcPQG__s1Q7X-A40li9UpTDEuylrb27nXBkPy9Oq3N8',
  }
}

const App = () => {
 
  const [searchTerm, setSearchTerm] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [movieList, setMovieList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);

  // Use useDebounce to delay the search term update
  // This will help reduce the number of API calls when the user types quickly
  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }
  , 5000, [searchTerm]);

  const fetchMovies = async (query="") => {
    setIsLoading(true);
    setErrorMessage(""); // Reset error message before fetching
    console.log(API_KEY)
    if (!API_KEY) {
      setErrorMessage("API key is missing. Please check your .env file and VITE_TMDB_API_KEY variable.");
      return;
    }
    try {
      // Construct the endpoint URL with the API key
      const endpoint = query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      console.log("Fetching from endpoint:", endpoint); // Debug: log endpoint

      // Fetch movies from the API
      const response = await fetch(endpoint, API_OPTIONS);
      //error handling for response
      if (!response.ok) {
        // Log response status and body for debugging
        const errorText = await response.text();
        console.error(`Fetch failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch movies: ${response.status} ${response.statusText}`);
      }
      // Parse the JSON response
      const data = await response.json();
      console.log("Fetched data:", data); // Debug: log fetched data
      if (data.response === "False") {
        throw new Error(data.Error||"No results found");
        setMovieList(data.results || []);
        return;}

      setMovieList(data.results || []); //actually set the movie list
      
      if (query && data.results && data.results.length > 0) {
        // Update search count in Appwrite database
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error("Error fetching movies:", error.message, error);
      setErrorMessage(
        "Failed to fetch movies. Please check your network connection, API key, and CORS settings. See console for details."
      );
    } finally{
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error loading trending movies:", error);
    }
  }


  // Fetch movies when the component mounts
  useEffect(() => { fetchMovies(searchTerm); }, [searchTerm]);
  useEffect(() => {loadTrendingMovies()}, []);

  return (
    <main>
      <div className="pattern"/>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero banner"/>
          <h1>Discover <span className="text-gradient">Films</span> You'll <br/><span className="text-gradient">Actually</span> Love!</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 className="">All Movies</h2>
          
          {isLoading ? (
            <Spinner/>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>

    </main>
  );
}
export default App;