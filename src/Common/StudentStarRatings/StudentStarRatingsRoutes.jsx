import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import EnterpriseRecognitionPage from '../Recognition/EnterpriseRecognitionPage'
import AddRatings from './AddRatings'
import SomMatrixPage from './SomMatrixPage'

export const StudentStarRatingsRoutes = ({ basePath }) => (
    <>
        <Route path={`${basePath}/star-ratings`} element={<EnterpriseRecognitionPage view="som" defaultDomain="academic" />} />
        <Route path={`${basePath}/star-ratings/som-matrix`} element={<EnterpriseRecognitionPage view="som" defaultDomain="academic" />} />
        <Route path={`${basePath}/star-ratings/star-of-month`} element={<EnterpriseRecognitionPage view="som" defaultDomain="academic" />} />
        <Route path={`${basePath}/star-ratings/star-of-year`} element={<EnterpriseRecognitionPage view="soy" defaultDomain="academic" />} />
        <Route path={`${basePath}/star-ratings/add-ratings`} element={<AddRatings />} />
        <Route path={`${basePath}/star-ratings-list`} element={<Navigate to={`${basePath}/star-ratings/star-of-month`} replace />} />
    </>
)
