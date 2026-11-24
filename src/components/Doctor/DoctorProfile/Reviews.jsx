

import React from 'react';
import '../Reviews/Reviews.css';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import img from '../../../images/avatar.jpg';
import { useGetDoctorReviewsQuery } from '../../../redux/api/reviewsApi';
import { FaRegThumbsUp } from "react-icons/fa";
import moment from 'moment';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import { Empty, Rate } from 'antd';

const Reviews = () => {
    const { data: loginInfo } = useAuthCheck();

    const { data, isError, isLoading } = useGetDoctorReviewsQuery(
        loginInfo?.id,
        { skip: !loginInfo?.id }
    );

    let content = null;

    if (!isLoading && isError) {
        content = <div>Something Went Wrong!</div>;
    }

    if (!isLoading && !isError && (!data || data.length === 0)) {
        content = <Empty />;
    }

    if (!isLoading && !isError && data?.length > 0) {
        content = (
            <>
                {data.map((item, key) => (
                    <div className="mb-4" key={item?.id || key}>
                        <div className="d-flex gap-3 justify-content-between">
                            <div className="d-flex gap-4">
                                <div className="review-img">
                                    <img
                                        className=""
                                        alt="Patient"
                                        src={item?.patient?.img || img}
                                    />
                                </div>

                                <div>
                                    <h5 className="text-nowrap text-capitalize">
                                        {item?.patient?.firstName} {item?.patient?.lastName}
                                    </h5>

                                    <p className="text-success">
                                        <FaRegThumbsUp />{' '}
                                        {item?.isRecommended
                                            ? 'I recommend the doctor'
                                            : 'I do not recommend the doctor'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-end">
                                <div>
                                    <Rate
                                        disabled
                                        value={Number(item?.star) || 5}
                                        style={{ fontSize: 15 }}
                                    />
                                </div>

                                <div>
                                    Reviewed {moment(item?.createdAt).startOf('day').fromNow()}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="mx-2 form-text">{item?.description}</p>
                        </div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <DashboardLayout>
            <div
                className="w-100 mb-3 rounded py-3 px-2"
                style={{ background: 'var(--surface-2)' }}
            >
                {content}
            </div>
        </DashboardLayout>
    );
};

export default Reviews;
