import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      <div className="container bg-dark text-light  p-5">
        <div className="row ">
          <div className="col-md-12 p-5 d-flex flex-column align-items-center justify-content-center">
            <h2 className="fs-2 fw-bolder">Wants to registered as a Hospital</h2>
            <button className="btn btn-danger  fw-bold mt-4">
              <Link to="register-as-hospital">Join Now </Link>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
