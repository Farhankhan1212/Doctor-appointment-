import React from 'react'
import { Button, Popconfirm, Table, Tag, message } from 'antd';
import AdminLayout from '../AdminLayout/AdminLayout'
import { useGetAdminDoctorsQuery, useSetDoctorApprovalMutation } from '../../../redux/api/doctorApi';
import './Doctors.css';

// Admin: review every doctor, check the registration number against the
// NMC / UP Medical Council register, then Approve. Only approved doctors
// show up for patients.
const Doctors = () => {
    const { data, isLoading, isError, error } = useGetAdminDoctorsQuery({ limit: 100 });
    const [setDoctorApproval, { isLoading: isSaving }] = useSetDoctorApprovalMutation();

    const handleApproval = async (id, approved) => {
        const res = await setDoctorApproval({ id, approved });
        if (res?.error) {
            message.error(res.error?.data?.message || 'Something went wrong');
        } else {
            message.success(approved ? 'Doctor approved' : 'Approval removed');
        }
    }

    const columns = [
        {
            title: 'Doctor',
            key: 'name',
            render: (_, d) => `Dr. ${d.firstName} ${d.lastName}`,
        },
        { title: 'Specialization', dataIndex: 'specialization', key: 'specialization' },
        { title: 'Degree', dataIndex: 'degree', key: 'degree' },
        { title: 'Registration No.', dataIndex: 'registration', key: 'registration', render: (v) => v || <Tag color="red">Missing</Tag> },
        { title: 'City', dataIndex: 'city', key: 'city' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Email verified',
            dataIndex: 'verified',
            key: 'verified',
            render: (v) => (v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>),
        },
        {
            title: 'Status',
            dataIndex: 'approved',
            key: 'approved',
            render: (v) => (v ? <Tag color="green">Approved</Tag> : <Tag color="orange">Pending</Tag>),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, d) => d.approved ? (
                <Popconfirm title="Remove approval? The doctor will be hidden from patients." onConfirm={() => handleApproval(d.id, false)}>
                    <Button danger size="small" disabled={isSaving}>Remove</Button>
                </Popconfirm>
            ) : (
                <Button type="primary" size="small" disabled={isSaving} onClick={() => handleApproval(d.id, true)}>Approve</Button>
            ),
        },
    ];

    return (
        <>
            <AdminLayout>
                <h4 className="mb-3">Doctors ({data?.meta?.total ?? 0})</h4>
                {isError && (
                    <p className="text-danger">
                        {error?.data?.message || 'Could not load doctors. Log in as admin first.'}
                    </p>
                )}
                <Table
                    rowKey="id"
                    loading={isLoading}
                    columns={columns}
                    dataSource={data?.doctors || []}
                    scroll={{ x: true }}
                    pagination={{ pageSize: 10 }}
                />
            </AdminLayout>
        </>
    )
}
export default Doctors;
