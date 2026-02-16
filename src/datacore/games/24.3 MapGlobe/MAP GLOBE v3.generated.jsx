"use client";
import React from 'react';

export async function View(dcProps) {
    const dc = dcProps.dc || {};
const { View } = await dc.require(dc.headerLink(dc.resolvePath("D.q.mapglobe.viewer.v3.md"), "ViewViewer"));
return (props) => <View />;
}