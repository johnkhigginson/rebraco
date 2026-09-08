using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Applications",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    UnitId = table.Column<int>(type: "int", nullable: true),
                    MemberKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicantFirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ApplicantLastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ApplicantEmail = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    ApplicantPhone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    DesiredMoveInDate = table.Column<DateOnly>(type: "date", nullable: true),
                    DesiredLeaseTerm = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmploymentJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RentalHistoryJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferencesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmergencyContactJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VehicleJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoSignerJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PetsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdditionalNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FeeAmountCents = table.Column<long>(type: "bigint", nullable: true),
                    FeePaidAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    StripeCheckoutSessionId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReviewedByMemberKey = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DenialReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ConvertedTenantId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Applications_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalSchema: "rebraco",
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Applications_Tenants_ConvertedTenantId",
                        column: x => x.ConvertedTenantId,
                        principalSchema: "rebraco",
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Applications_Units_UnitId",
                        column: x => x.UnitId,
                        principalSchema: "rebraco",
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Applications_ApplicantEmail",
                schema: "rebraco",
                table: "Applications",
                column: "ApplicantEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_ConvertedTenantId",
                schema: "rebraco",
                table: "Applications",
                column: "ConvertedTenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_MemberKey",
                schema: "rebraco",
                table: "Applications",
                column: "MemberKey");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_PropertyId",
                schema: "rebraco",
                table: "Applications",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_Status",
                schema: "rebraco",
                table: "Applications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_StripeCheckoutSessionId",
                schema: "rebraco",
                table: "Applications",
                column: "StripeCheckoutSessionId",
                filter: "[StripeCheckoutSessionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_UnitId",
                schema: "rebraco",
                table: "Applications",
                column: "UnitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Applications",
                schema: "rebraco");
        }
    }
}
