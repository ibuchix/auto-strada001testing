
/**
 * Required Photos Grid Component
 * Created: 2025-05-03
 * 
 * Grid layout for all required vehicle photos
 */

import { TempStoredFile } from "@/services/temp-storage/tempFileStorageService";

interface PhotoAreaProps {
  files: TempStoredFile[];
  isUploading: boolean;
  progress: number;
  uploadFiles: (files: FileList | File[]) => Promise<TempStoredFile[]>;
  removeFile: (fileId: string) => boolean;
}

interface RequiredPhotosGridProps {
  frontView: PhotoAreaProps;
  rearView: PhotoAreaProps;
  driverSide: PhotoAreaProps;
  passengerSide: PhotoAreaProps;
  dashboard: PhotoAreaProps;
  interiorFront: PhotoAreaProps;
  interiorRear: PhotoAreaProps;
}

export const RequiredPhotosGrid = ({
  frontView,
  rearView,
  driverSide,
  passengerSide,
  dashboard,
  interiorFront,
  interiorRear
}: RequiredPhotosGridProps) => {
  // Reusable photo upload area
  const PhotoUploadArea = ({ 
    title, 
    description, 
    id, 
    files,
    isUploading,
    progress,
    uploadFiles,
    removeFile
  }: {
    title: string;
    description: string;
    id: string;
  } & PhotoAreaProps) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      uploadFiles(e.target.files);
    };
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
        
        <div className="border rounded-lg p-2">
          {files.length > 0 ? (
            <div className="aspect-video relative">
              <img 
                src={files[0].preview} 
                alt={title} 
                className="w-full h-full object-cover rounded"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                onClick={() => removeFile(files[0].id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-gray-50 rounded">
              {isUploading ? (
                <div className="w-full px-4">
                  <div className="h-1 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-1 bg-primary rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-xs text-center">Uploading...</p>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  
                  <input
                    id={id}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  <label 
                    htmlFor={id} 
                    className="mt-2 px-3 py-1 bg-primary text-white text-xs rounded cursor-pointer"
                  >
                    Select Photo
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PhotoUploadArea
        id="front-view"
        title="Front View"
        description="Clear photo of the front of the vehicle"
        files={frontView.files}
        isUploading={frontView.isUploading}
        progress={frontView.progress}
        uploadFiles={frontView.uploadFiles}
        removeFile={frontView.removeFile}
      />
      
      <PhotoUploadArea
        id="rear-view"
        title="Rear View"
        description="Clear photo of the back of the vehicle"
        files={rearView.files}
        isUploading={rearView.isUploading}
        progress={rearView.progress}
        uploadFiles={rearView.uploadFiles}
        removeFile={rearView.removeFile}
      />
      
      <PhotoUploadArea
        id="driver-side"
        title="Driver Side"
        description="Side view of the vehicle (driver's side)"
        files={driverSide.files}
        isUploading={driverSide.isUploading}
        progress={driverSide.progress}
        uploadFiles={driverSide.uploadFiles}
        removeFile={driverSide.removeFile}
      />
      
      <PhotoUploadArea
        id="passenger-side"
        title="Passenger Side"
        description="Side view of the vehicle (passenger's side)"
        files={passengerSide.files}
        isUploading={passengerSide.isUploading}
        progress={passengerSide.progress}
        uploadFiles={passengerSide.uploadFiles}
        removeFile={passengerSide.removeFile}
      />
      
      <PhotoUploadArea
        id="dashboard"
        title="Dashboard"
        description="Clear photo of the dashboard"
        files={dashboard.files}
        isUploading={dashboard.isUploading}
        progress={dashboard.progress}
        uploadFiles={dashboard.uploadFiles}
        removeFile={dashboard.removeFile}
      />
      
      <PhotoUploadArea
        id="interior-front"
        title="Interior (Front)"
        description="Photo of the front seats and interior"
        files={interiorFront.files}
        isUploading={interiorFront.isUploading}
        progress={interiorFront.progress}
        uploadFiles={interiorFront.uploadFiles}
        removeFile={interiorFront.removeFile}
      />
      
      <PhotoUploadArea
        id="interior-rear"
        title="Interior (Rear)"
        description="Photo of the back seats and rear interior"
        files={interiorRear.files}
        isUploading={interiorRear.isUploading}
        progress={interiorRear.progress}
        uploadFiles={interiorRear.uploadFiles}
        removeFile={interiorRear.removeFile}
      />
    </div>
  );
};
