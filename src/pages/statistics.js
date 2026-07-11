import './statistics.css';
import { getSupabaseClient } from '../lib/supabase.js';

export const renderStatisticsPage = () => ({
    html: `
    <section class="container py-5">

      <div class="row justify-content-center">

        <div class="col-12 col-lg-10">

          <div class="card-glow rounded-4 p-4">

            <div class="text-center mb-5">
              <h1 class="fw-bold text-info">
                Player Statistics
              </h1>

              <p class="text-secondary">
                Your progress and achievements
              </p>
            </div>


            <div id="statistics-loading" 
                 class="text-center text-secondary">
              Loading statistics...
            </div>


            <div id="statistics-content"
                 class="row g-4 d-none">


              <div class="col-12 col-md-6 col-lg-4">
                <div class="card bg-dark border-info shadow-lg h-100">
                  <div class="card-body text-center">

                    <div class="fs-1 text-info">
                      🎮
                    </div>

                    <h6 class="text-secondary">
                      Games Played
                    </h6>

                    <h2 id="games-played"
                        class="fw-bold text-white">
                    </h2>

                  </div>
                </div>
              </div>



              <div class="col-12 col-md-6 col-lg-4">
                <div class="card bg-dark border-warning shadow-lg h-100">
                  <div class="card-body text-center">

                    <div class="fs-1 text-warning">
                      🏆
                    </div>

                    <h6 class="text-secondary">
                      Best Score
                    </h6>

                    <h2 id="best-score"
                        class="fw-bold text-white">
                    </h2>

                  </div>
                </div>
              </div>



              <div class="col-12 col-md-6 col-lg-4">
                <div class="card bg-dark border-success shadow-lg h-100">
                  <div class="card-body text-center">

                    <div class="fs-1 text-success">
                      ⭐
                    </div>

                    <h6 class="text-secondary">
                      Highest Level
                    </h6>

                    <h2 id="highest-level"
                        class="fw-bold text-white">
                    </h2>

                  </div>
                </div>
              </div>




              <div class="col-12 col-md-6">

                <div class="card bg-dark border-danger shadow-lg">

                  <div class="card-body text-center">

                    <h6 class="text-secondary">
                      Enemies Defeated
                    </h6>

                    <h2 id="enemies-killed"
                        class="fw-bold text-danger">
                    </h2>

                  </div>

                </div>

              </div>


              <div class="col-12 col-md-6">

                <div class="card bg-dark border-primary shadow-lg">

                  <div class="card-body text-center">

                    <h6 class="text-secondary">
                      Total Score
                    </h6>

                    <h2 id="total-score"
                        class="fw-bold text-primary">
                    </h2>

                  </div>

                </div>

              </div>


            </div>

          </div>

        </div>

      </div>

    </section>
    `,


    onMount: async () => {

        const supabase = getSupabaseClient();


        const loading =
            document.getElementById('statistics-loading');

        const content =
            document.getElementById('statistics-content');


        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();


        if (userError || !userData.user) {
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new Event('popstate'));
            return;
        }

        const {
            data,
            error
        } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', userData.user.id)
            .maybeSingle();


        if (error) {

            loading.innerHTML =
                `
            <div class="alert alert-danger">
                Unable to load statistics.
            </div>
            `;

            return;
        }


        if (!data) {

            loading.innerHTML =
                `
            <div class="alert alert-info">
                No games played yet.
            </div>
            `;

            return;

        }


        document.getElementById('games-played')
            .textContent = data.games_played;


        document.getElementById('best-score')
            .textContent = data.best_score;


        document.getElementById('highest-level')
            .textContent = data.highest_level;


        document.getElementById('enemies-killed')
            .textContent = data.total_enemies_killed;


        document.getElementById('total-score')
            .textContent = data.total_score;



        loading.classList.add('d-none');
        content.classList.remove('d-none');

    }
});