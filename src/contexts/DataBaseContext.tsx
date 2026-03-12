import { createContext } from "react";
import type { DatabaseProvider } from "../dataProviders/DatabaseProvider";

export const DataBaseContext = createContext<DatabaseProvider | null>(null);
