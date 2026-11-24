
import React from 'react';
import { Link } from 'react-router-dom';
import showImg from '../../../images/specialities/specialities-01.png';
import { Tag, Rate } from 'antd';
import './index.css';
import {
    FaLocationArrow,
    FaRegThumbsUp,
    FaComment
} from 'react-icons/fa';

const SearchContent = ({ data }) => {
    const services = data?.services?.split(',') || [];

    const reviews = data?.reviews || [];
    const totalReviews = reviews.length;

    const avgRating = totalReviews
        ? reviews.reduce(
              (sum, review) => sum + Number(review.star || 0),
              0
          ) / totalReviews
        : 0;

    const recommendPercent = totalReviews
        ? Math.round(
              (reviews.filter((review) => review.isRecommended).length /
                  totalReviews) *
                  100
          )
        : 0;

    return (
        <div className="mb-4 rounded" style={{ background: 'var(--surface-2)' }}>
            <div className="d-flex p-3 justify-content-between">
                <div className="d-flex gap-3">
                    <div className="doc-img-fluid d-flex align-items-center">
                        {data?.img && (
                            <img
                                src={data.img}
                                className=""
                                alt="User Image"
                            />
                        )}
                    </div>

                    <div className="doc-info">
                        <h5 className="mb-0">
                            <Link to={`/doctors/profile/${data?.id}`}>
                                Dr. {data?.firstName} {data?.lastName}
                            </Link>
                        </h5>

                        <p className="m-0 form-text">
                            {data?.designation}
                        </p>

                        <p className="doc-department m-0">
                            <img
                                src={showImg}
                                className="img-fluid"
                                alt="Speciality"
                            />
                            {data?.specialization || 'General Physician'}
                        </p>

                        <div className="d-flex align-items-center">
                            <div>
                                <Rate
                                    disabled
                                    allowHalf
                                    value={avgRating}
                                    style={{ fontSize: 15 }}
                                />
                            </div>

                            <div className="ms-2">({totalReviews})</div>
                        </div>

                        <div className="clinic-details">
                            <p className="form-text text-secondary">
                                <FaLocationArrow /> {data?.address},{' '}
                                {data?.country}
                            </p>

                            <ul className="clinic-gallery mt-3">
                                {[1, 2, 3, 4].map((item) => (
                                    <li key={item}>
                                        <img
                                            src={showImg}
                                            alt="Feature"
                                            style={{ maxWidth: '30px' }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {services.map((item, id) => (
                            <Tag key={id + 51}>{item}</Tag>
                        ))}
                    </div>
                </div>

                <div className="doc-info-right me-3">
                    <div className="clini-infos">
                        <ul>
                            <li>
                                <FaRegThumbsUp /> {recommendPercent}%
                            </li>

                            <li>
                                <FaComment /> {totalReviews} Feedback
                            </li>

                            <li>
                                <FaLocationArrow />{' '}
                                {(data?.city || '').toUpperCase()}
                            </li>

                            <li>₹ {data?.price || '-'} fee</li>
                        </ul>
                    </div>

                    <div className="clinic-booking">
                        <Link
                            to={`/doctors/profile/${data?.id}`}
                            className="view-pro-btn"
                        >
                            View Profile
                        </Link>

                        <Link
                            to={`/booking/${data?.id}`}
                            className="apt-btn"
                        >
                            Book Appointment
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchContent;
