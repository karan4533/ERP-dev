import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import StarRatings from './StarRatings'
import AddRatings from './AddRatings'
import SomMatrixPage from './SomMatrixPage'

export const StudentStarRatingsRoutes = ({ basePath }) => (
    <>
        <Route path={`${basePath}/star-ratings/som-matrix`} element={<SomMatrixPage />} />
        <Route path={`${basePath}/star-ratings/star-of-month`} element={<StarRatings view="som" />} />
        <Route path={`${basePath}/star-ratings/star-of-year`} element={<StarRatings view="soy" />} />
        <Route path={`${basePath}/star-ratings/add-ratings`} element={<AddRatings />} />
        <Route path={`${basePath}/star-ratings-list`} element={<Navigate to={`${basePath}/star-ratings/star-of-month`} replace />} />
    </>
)
